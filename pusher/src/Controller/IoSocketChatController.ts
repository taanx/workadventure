import { ExSocketInterface } from "../Model/Websocket/ExSocketInterface";
import {
    SubMessage,
    BatchMessage,
    XmppMessage,
    IframeToPusherMessage,
    BanUserByUuidMessage,
} from "../Messages/generated/messages_pb";
import { parse } from "query-string";
import { jwtTokenManager, tokenInvalidException } from "../Services/JWTTokenManager";
import { FetchMemberDataByUuidResponse } from "../Services/AdminApi";
import { socketManager } from "../Services/SocketManager";
import { emitInBatch } from "../Services/IoSocketHelpers";
import {
    ADMIN_API_URL,
    DISABLE_ANONYMOUS,
    EJABBERD_DOMAIN,
    EJABBERD_JWT_SECRET,
    MAX_HISTORY_CHAT,
    SOCKET_IDLE_TIMER,
} from "../Enum/EnvironmentVariable";
import Axios from "axios";
import { InvalidTokenError } from "./InvalidTokenError";
import HyperExpress from "hyper-express";
import { WebSocket } from "uWebSockets.js";
import { adminService } from "../Services/AdminService";
import { ErrorApiData, isErrorApiData } from "../Messages/JsonMessages/ErrorApiData";
import { apiVersionHash } from "../Messages/JsonMessages/ApiVersion";

/**
 * The object passed between the "open" and the "upgrade" methods when opening a websocket
 */
interface UpgradeData {
    // Data passed here is accessible on the "websocket" socket object.
    rejected: false;
    token: string;
    userUuid: string;
    IPAddress: string;
    playUri: string;
    maxHistoryChat: number;
    tags: string[];
    userRoomToken: string | undefined;
    mucRooms: Array<MucRoomDefinitionInterface> | undefined;
}

interface UpgradeFailedInvalidData {
    rejected: true;
    reason: "tokenInvalid" | "textureInvalid" | "invalidVersion" | null;
    message: string;
    playUri: string;
}

import Jwt from "jsonwebtoken";
import { MucRoomDefinitionInterface } from "../Messages/JsonMessages/MucRoomDefinitionInterface";
import { XmppClient } from "../Services/XmppClient";
import jid from "@xmpp/jid";
import { isUserRoomToken } from "../Messages/JsonMessages/AdminApiData";

interface UpgradeFailedErrorData {
    rejected: true;
    reason: "error";
    error: ErrorApiData;
}

interface CacheRoomData {
    maxHistoryChat: number;
    timestamp: number;
}

type UpgradeFailedData = UpgradeFailedErrorData | UpgradeFailedInvalidData;

export class IoSocketChatController {
    private nextUserId = 1;
    private cache: Map<string, CacheRoomData> = new Map();

    constructor(private readonly app: HyperExpress.compressors.TemplatedApp) {
        this.ioConnection();
    }

    ioConnection(): void {
        this.app.ws("/chat", {
            /* Options */
            //compression: uWS.SHARED_COMPRESSOR,
            idleTimeout: SOCKET_IDLE_TIMER,
            maxPayloadLength: 16 * 1024 * 1024,
            maxBackpressure: 65536, // Maximum 64kB of data in the buffer.
            //idleTimeout: 10,
            upgrade: (res, req, context) => {
                // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
                (async () => {
                    /* Keep track of abortions */
                    const upgradeAborted = { aborted: false };

                    res.onAborted(() => {
                        /* We can simply signal that we were aborted */
                        upgradeAborted.aborted = true;
                    });

                    const query = parse(req.getQuery());
                    const websocketKey = req.getHeader("sec-websocket-key");
                    const websocketProtocol = req.getHeader("sec-websocket-protocol");
                    const websocketExtensions = req.getHeader("sec-websocket-extensions");
                    const IPAddress = req.getHeader("x-forwarded-for");
                    const locale = req.getHeader("accept-language");

                    let maxHistoryChat = MAX_HISTORY_CHAT;

                    const playUri = query.playUri;
                    try {
                        if (typeof playUri !== "string") {
                            throw new Error("Undefined room ID: ");
                        }

                        const token = query.token;
                        const version = query.version;
                        const uuid = query.uuid as string;

                        if (version !== apiVersionHash) {
                            return res.upgrade(
                                {
                                    rejected: true,
                                    reason: "error",
                                    error: {
                                        type: "retry",
                                        title: "Please refresh",
                                        subtitle: "New version available",
                                        image: "/resources/icons/new_version.png",
                                        code: "NEW_VERSION",
                                        details:
                                            "A new version of WorkAdventure is available. Please refresh your window",
                                        canRetryManual: true,
                                        buttonTitle: "Refresh",
                                        timeToRetry: 999999,
                                    },
                                } as UpgradeFailedData,
                                websocketKey,
                                websocketProtocol,
                                websocketExtensions,
                                context
                            );
                        }

                        const tokenData =
                            token && typeof token === "string" ? jwtTokenManager.verifyJWTToken(token) : null;

                        if (DISABLE_ANONYMOUS && !tokenData) {
                            throw new Error("Expecting token");
                        }

                        const userIdentifier = tokenData ? tokenData.identifier : uuid ?? "";
                        const isLogged = !!tokenData?.accessToken;

                        let memberTags: string[] = [];
                        let memberUserRoomToken: string | undefined;
                        let userData: FetchMemberDataByUuidResponse = {
                            email: userIdentifier,
                            userUuid: userIdentifier,
                            tags: [],
                            visitCardUrl: null,
                            textures: [],
                            anonymous: true,
                            userRoomToken: undefined,
                            messages: [],
                            jabberId: null,
                            jabberPassword: null,
                            mucRooms: [],
                        };

                        try {
                            try {
                                userData = await adminService.fetchMemberDataByUuid(
                                    userIdentifier,
                                    isLogged,
                                    playUri,
                                    IPAddress,
                                    [],
                                    locale
                                );
                            } catch (err) {
                                if (Axios.isAxiosError(err)) {
                                    const errorType = isErrorApiData.safeParse(err?.response?.data);
                                    if (errorType.success) {
                                        return res.upgrade(
                                            {
                                                rejected: true,
                                                reason: "error",
                                                status: err?.response?.status,
                                                error: errorType.data,
                                            } as UpgradeFailedData,
                                            websocketKey,
                                            websocketProtocol,
                                            websocketExtensions,
                                            context
                                        );
                                    } else {
                                        return res.upgrade(
                                            {
                                                rejected: true,
                                                reason: null,
                                                status: 500,
                                                message: err?.response?.data,
                                                playUri: playUri,
                                            } as UpgradeFailedData,
                                            websocketKey,
                                            websocketProtocol,
                                            websocketExtensions,
                                            context
                                        );
                                    }
                                }
                                throw err;
                            }
                            memberTags = userData.tags;
                            memberUserRoomToken = userData.userRoomToken;
                        } catch (e) {
                            console.log(
                                "access not granted for user " +
                                    (userIdentifier || "anonymous") +
                                    " and room " +
                                    playUri
                            );
                            console.error(e);
                            throw new Error("User cannot access this world");
                        }

                        if (!userData.jabberId) {
                            // If there is no admin, or no user, let's log users using JWT tokens
                            userData.jabberId = jid(userIdentifier, EJABBERD_DOMAIN).toString();
                            if (EJABBERD_JWT_SECRET) {
                                userData.jabberPassword = Jwt.sign({ jid: userData.jabberId }, EJABBERD_JWT_SECRET, {
                                    expiresIn: "30d",
                                    algorithm: "HS256",
                                });
                            } else {
                                userData.jabberPassword = "no_password_set";
                            }
                        }

                        if (userData.userRoomToken && ADMIN_API_URL) {
                            const jwtDecoded = isUserRoomToken.parse(
                                jwtTokenManager.verifyJWTToken(userData.userRoomToken)
                            );
                            // If cached lifetime is less than 5 minutes (300_000)
                            if (
                                this.cache.has(jwtDecoded.room) &&
                                this.cache.get(jwtDecoded.room) &&
                                (this.cache.get(jwtDecoded.room)?.timestamp || 0) > Date.now() - 300_000
                            ) {
                                // @ts-ignore
                                maxHistoryChat = this.cache.get(jwtDecoded.room).maxHistoryChat;
                            } else {
                                maxHistoryChat = await Axios.get(`${ADMIN_API_URL}/api/limit/historyChat`, {
                                    headers: { userRoomToken: userData.userRoomToken },
                                })
                                    .then((response) => parseInt(response.data))
                                    .catch((err) => {
                                        if (Axios.isAxiosError(err) && err.response?.status === 402) {
                                            return parseInt(err.response?.data);
                                        }
                                        console.error(err);
                                        return -1;
                                    });
                                this.cache.set(jwtDecoded.room, {
                                    maxHistoryChat: maxHistoryChat,
                                    timestamp: Date.now(),
                                });
                            }
                        }

                        // Generate characterLayers objects from characterLayers string[]
                        /*const characterLayerObjs: CharacterLayer[] =
                            SocketManager.mergeCharacterLayersAndCustomTextures(characterLayers, memberTextures);*/

                        if (upgradeAborted.aborted) {
                            console.log("Ouch! Client disconnected before we could upgrade it!");
                            /* You must not upgrade now */
                            return;
                        }

                        /* This immediately calls open handler, you must not use res after this call */
                        res.upgrade(
                            {
                                // Data passed here is accessible on the "websocket" socket object.
                                rejected: false,
                                token,
                                userUuid: userData.userUuid,
                                IPAddress,
                                userIdentifier,
                                playUri,
                                maxHistoryChat,
                                tags: memberTags,
                                userRoomToken: memberUserRoomToken,
                                jabberId: userData.jabberId,
                                jabberPassword: userData.jabberPassword,
                                mucRooms: userData.mucRooms,
                            } as UpgradeData,
                            /* Spell these correctly */
                            websocketKey,
                            websocketProtocol,
                            websocketExtensions,
                            context
                        );
                    } catch (e) {
                        if (e instanceof Error) {
                            if (!(e instanceof InvalidTokenError)) {
                                console.error(e);
                            }
                            res.upgrade(
                                {
                                    rejected: true,
                                    reason: e instanceof InvalidTokenError ? tokenInvalidException : null,
                                    message: e.message,
                                    playUri,
                                } as UpgradeFailedData,
                                websocketKey,
                                websocketProtocol,
                                websocketExtensions,
                                context
                            );
                        } else {
                            res.upgrade(
                                {
                                    rejected: true,
                                    reason: null,
                                    message: "500 Internal Server Error",
                                    playUri,
                                } as UpgradeFailedData,
                                websocketKey,
                                websocketProtocol,
                                websocketExtensions,
                                context
                            );
                        }
                    }
                })();
            },
            /* Handlers */
            open: (_ws: WebSocket) => {
                const ws = _ws as WebSocket & (UpgradeData | UpgradeFailedData);
                if (ws.rejected === true) {
                    setTimeout(() => ws.close(), 0);
                    return;
                }

                // Let's join the room
                this.initClient(ws); // const client =
            },
            message: (ws, arrayBuffer): void => {
                const client = ws as ExSocketInterface;
                const message = IframeToPusherMessage.deserializeBinary(new Uint8Array(arrayBuffer));

                if (message.hasXmppmessage()) {
                    socketManager.handleXmppMessage(client, message.getXmppmessage() as XmppMessage);
                } else if (message.hasBanuserbyuuidmessage()) {
                    socketManager.handleBanUserByUuidMessage(
                        client,
                        message.getBanuserbyuuidmessage() as BanUserByUuidMessage
                    );
                }
                /* Ok is false if backpressure was built up, wait for drain */
                //let ok = ws.send(message, isBinary);
            },
            drain: (ws) => {
                console.log("WebSocket backpressure: " + ws.getBufferedAmount());
            },
            close: (ws) => {
                console.log("IoSocketChatController closing ...");
                const client = ws as ExSocketInterface;
                try {
                    client.disconnecting = true;
                    if (client.xmppClient != undefined) {
                        client.xmppClient.close();
                    }
                } catch (e) {
                    console.error('An error occurred on "disconnect"');
                    console.error(e);
                }
            },
        });
    }

    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    private initClient(ws: any): ExSocketInterface {
        const client: ExSocketInterface = ws;
        client.userId = this.nextUserId;
        this.nextUserId++;
        client.userUuid = ws.userUuid;
        client.IPAddress = ws.IPAddress;
        client.token = ws.token;
        client.batchedMessages = new BatchMessage();
        client.batchTimeout = null;
        client.emitInBatch = (payload: SubMessage): void => {
            emitInBatch(client, payload);
        };
        client.disconnecting = false;

        client.messages = ws.messages;
        client.userIdentifier = ws.userIdentifier;
        client.tags = ws.tags;
        client.playUri = ws.roomId;
        client.maxHistoryChat = ws.maxHistoryChat;
        client.jabberId = ws.jabberId;
        client.jabberPassword = ws.jabberPassword;
        client.mucRooms = ws.mucRooms;

        console.info("IoSocketChatController => initClient => XmppClient");
        client.xmppClient = new XmppClient(client, client.mucRooms);

        return client;
    }
}
