import { registeredCallbacks } from "./Api/Iframe/registeredCallbacks";
import {
    isIframeAnswerEvent,
    isIframeErrorAnswerEvent,
    isIframeResponseEvent,
    isLookingLikeIframeEventWrapper,
    TypedMessageEvent,
} from "./Api/Events/IframeEvent";
import chat from "./Api/Iframe/chat";
import nav, { CoWebsite } from "./Api/Iframe/nav";
import controls from "./Api/Iframe/controls";
import ui from "./Api/Iframe/ui";
import sound from "./Api/Iframe/sound";
import room, { setMapURL, setRoomId } from "./Api/Iframe/room";
import { createState } from "./Api/Iframe/state";
import player, { setPlayerName, setPlayerLanguage, setTags, setUserRoomToken, setUuid } from "./Api/Iframe/player";
import players from "./Api/Iframe/players";
import type { ButtonDescriptor } from "./Api/Iframe/Ui/ButtonDescriptor";
import type { Popup } from "./Api/Iframe/Ui/Popup";
import type { Sound } from "./Api/Iframe/Sound/Sound";
import { answerPromises, queryWorkadventure } from "./Api/Iframe/IframeApiContribution";
import camera from "./Api/Iframe/camera";
export type { UIWebsite } from "./Api/Iframe/Ui/UIWebsite";
export type { Menu } from "./Api/Iframe/Ui/Menu";
export type { ActionMessage } from "./Api/Iframe/Ui/ActionMessage";
export type { EmbeddedWebsite } from "./Api/Iframe/Room/EmbeddedWebsite";
export type { Area } from "./Api/Iframe/Area/Area";
export type { ActionsMenuAction } from "./Api/Iframe/ui";

const globalState = createState();

let _metadata: unknown | undefined;

const setMetadata = (data: unknown | undefined) => {
    _metadata = data;
};

// Notify WorkAdventure that we are ready to receive data
const initPromise = queryWorkadventure({
    type: "getState",
    data: undefined,
}).then((gameState) => {
    setPlayerName(gameState.nickname);
    setPlayerLanguage(gameState.language);
    setRoomId(gameState.roomId);
    setMapURL(gameState.mapUrl);
    setTags(gameState.tags);
    setUuid(gameState.uuid);
    setUserRoomToken(gameState.userRoomToken);
    setMetadata(gameState.metadata);
    globalState.initVariables(gameState.variables as Map<string, unknown>);
    player.state.initVariables(gameState.playerVariables as Map<string, unknown>);
});

const wa = {
    ui,
    nav,
    controls,
    chat,
    sound,
    room,
    player,
    players,
    camera,
    state: globalState,

    /**
     * When your script / iFrame loads WorkAdventure, it takes a few milliseconds for your
     * script / iFrame to exchange data with WorkAdventure. You should wait for the WorkAdventure
     * API to be fully ready using the WA.onInit() method.
     * {@link https://workadventu.re/map-building/api-start.md#waiting-for-workadventure-api-to-be-available | Website documentation}
     *
     * Some properties (like the current user name, or the room ID) are not available until WA.onInit has completed.
     *
     * @returns {void}
     */
    onInit(): Promise<void> {
        return initPromise;
    },

    /**
     * The metadata sent by the administration website.
     * Important: You need to wait for the end of the initialization before accessing.
     * {@link https://workadventu.re/map-building/api-metadata.md | Website documentation}
     *
     * @returns {unknown|undefined} Metadata
     */
    get metadata(): unknown | undefined {
        return _metadata;
    },

    // All methods below are deprecated and should not be used anymore.
    // They are kept here for backward compatibility.

    /**
     * @deprecated Use WA.chat.sendChatMessage instead
     */
    sendChatMessage(message: string, author: string): void {
        console.warn("Method WA.sendChatMessage is deprecated. Please use WA.chat.sendChatMessage instead");
        chat.sendChatMessage(message, author);
    },

    /**
     * @deprecated Use WA.chat.disablePlayerControls instead
     */
    disablePlayerControls(): void {
        console.warn(
            "Method WA.disablePlayerControls is deprecated. Please use WA.controls.disablePlayerControls instead"
        );
        controls.disablePlayerControls();
    },

    /**
     * @deprecated Use WA.controls.restorePlayerControls instead
     */
    restorePlayerControls(): void {
        console.warn(
            "Method WA.restorePlayerControls is deprecated. Please use WA.controls.restorePlayerControls instead"
        );
        controls.restorePlayerControls();
    },

    /**
     * @deprecated Use WA.ui.displayBubble instead
     */
    displayBubble(): void {
        console.warn("Method WA.displayBubble is deprecated. Please use WA.ui.displayBubble instead");
        ui.displayBubble();
    },

    /**
     * @deprecated Use WA.ui.removeBubble instead
     */
    removeBubble(): void {
        console.warn("Method WA.removeBubble is deprecated. Please use WA.ui.removeBubble instead");
        ui.removeBubble();
    },

    /**
     * @deprecated Use WA.nav.openTab instead
     */
    openTab(url: string): void {
        console.warn("Method WA.openTab is deprecated. Please use WA.nav.openTab instead");
        nav.openTab(url);
    },

    /**
     * @deprecated Use WA.sound.loadSound instead
     */
    loadSound(url: string): Sound {
        console.warn("Method WA.loadSound is deprecated. Please use WA.sound.loadSound instead");
        return sound.loadSound(url);
    },

    /**
     * @deprecated Use WA.nav.goToPage instead
     */
    goToPage(url: string): void {
        console.warn("Method WA.goToPage is deprecated. Please use WA.nav.goToPage instead");
        nav.goToPage(url);
    },

    /**
     * @deprecated Use WA.nav.goToRoom instead
     */
    goToRoom(url: string): void {
        console.warn("Method WA.goToRoom is deprecated. Please use WA.nav.goToRoom instead");
        nav.goToRoom(url);
    },

    /**
     * @deprecated Use WA.nav.openCoWebSite instead
     */
    openCoWebSite(url: string, allowApi = false, allowPolicy = ""): Promise<CoWebsite> {
        console.warn("Method WA.openCoWebSite is deprecated. Please use WA.nav.openCoWebSite instead");
        return nav.openCoWebSite(url, allowApi, allowPolicy);
    },

    /**
     * @deprecated Use WA.nav.closeCoWebSite instead
     */
    closeCoWebSite(): Promise<void> {
        console.warn("Method WA.closeCoWebSite is deprecated. Please use WA.nav.closeCoWebSite instead");
        return nav.closeCoWebSite();
    },

    /**
     * @deprecated Use WA.ui.openPopup instead
     */
    openPopup(targetObject: string, message: string, buttons: ButtonDescriptor[]): Popup {
        console.warn("Method WA.openPopup is deprecated. Please use WA.ui.openPopup instead");
        return ui.openPopup(targetObject, message, buttons);
    },
    /**
     * @deprecated Use WA.chat.onChatMessage instead
     */
    onChatMessage(callback: (message: string) => void): void {
        console.warn("Method WA.onChatMessage is deprecated. Please use WA.chat.onChatMessage instead");
        chat.onChatMessage(callback);
    },
    /**
     * @deprecated Use WA.room.onEnterZone instead
     */
    onEnterZone(name: string, callback: () => void): void {
        console.warn("Method WA.onEnterZone is deprecated. Please use WA.room.onEnterZone instead");
        room.onEnterZone(name, callback);
    },
    /**
     * @deprecated Use WA.room.onLeaveZone instead
     */
    onLeaveZone(name: string, callback: () => void): void {
        console.warn("Method WA.onLeaveZone is deprecated. Please use WA.room.onLeaveZone instead");
        room.onLeaveZone(name, callback);
    },
};

export type WorkAdventureApi = typeof wa;
export type { Sound, Popup, ButtonDescriptor, CoWebsite };

declare global {
    interface Window {
        WA: WorkAdventureApi;
    }
    let WA: WorkAdventureApi;
}

window.WA = wa;

window.addEventListener("message", (message: TypedMessageEvent<unknown>) => {
    if (message.source !== window.parent) {
        return; // Skip message in this event listener
    }
    const payload = message.data;

    //console.debug(payload);

    const safeParseErrorAnswerEvent = isIframeErrorAnswerEvent.safeParse(payload);
    if (safeParseErrorAnswerEvent.success) {
        const payloadData = safeParseErrorAnswerEvent.data;
        const queryId = payloadData.id;
        const payloadError = payloadData.error;

        const resolver = answerPromises.get(queryId);
        if (resolver === undefined) {
            throw new Error("In Iframe API, got an error answer for a question that we have no track of.");
        }
        resolver.reject(new Error(payloadError));

        answerPromises.delete(queryId);
    } else if (isIframeAnswerEvent(payload)) {
        const queryId = payload.id;
        const payloadData = payload.data;

        const resolver = answerPromises.get(queryId);
        if (resolver === undefined) {
            throw new Error("In Iframe API, got an answer for a question that we have no track of.");
        }
        resolver.resolve(payloadData);

        answerPromises.delete(queryId);
    } else {
        const safeParsedPayload = isIframeResponseEvent.safeParse(payload);
        if (safeParsedPayload.success) {
            const payloadData = safeParsedPayload.data;

            const callbacks = registeredCallbacks[payloadData.type];
            if (callbacks === undefined) {
                throw new Error('Missing event handler for event of type "' + payloadData.type + "'");
            }
            for (const callback of callbacks) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                callback?.(payloadData.data);
            }
        } else {
            const safeLooksLikeResponse = isLookingLikeIframeEventWrapper.safeParse(payload);
            if (safeLooksLikeResponse.success) {
                throw new Error(
                    "Could not parse message received from WorkAdventure. Message:" + JSON.stringify(payload)
                );
            }
        }
    }
});
