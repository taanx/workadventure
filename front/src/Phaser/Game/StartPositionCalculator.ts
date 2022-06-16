import type { PositionInterface } from "../../Connexion/ConnexionModels";
import type { ITiledMap, ITiledMapLayer, ITiledMapProperty, ITiledMapTileLayer } from "../Map/ITiledMap";
import type { GameMap } from "./GameMap";
import { GameMapProperties } from "./GameMapProperties";

const defaultStartPositionName = "start";

export class StartPositionCalculator {
    public startPosition!: PositionInterface;

    private startPositionName: string;

    constructor(
        private readonly gameMap: GameMap,
        private readonly mapFile: ITiledMap,
        private readonly initPosition: PositionInterface | null,
        startPositionName?: string
    ) {
        this.startPositionName = startPositionName || defaultStartPositionName;
        this.initStartXAndStartY();
    }

    public initPositionFromLayerName(selectedLayerName: string, defaultLayerName: string) {
        let foundLayer: ITiledMapLayer | null = null;

        console.log(selectedLayerName);

        const tileLayers = this.gameMap.flatLayers.filter((layer) => layer.type === "tilelayer");
        for (const layer of tileLayers) {
            //we want to prioritize the selectedLayer rather than "start" layer
            if (
                [layer.name, `#${layer.name}`].includes(selectedLayerName) ||
                layer.name.endsWith("/" + selectedLayerName)
            ) {
                foundLayer = layer;
                break;
            }
        }
        if (!foundLayer) {
            for (const layer of tileLayers) {
                if (layer.name === defaultStartPositionName || this.isStartLayer(layer)) {
                    foundLayer = layer;
                    break;
                }
            }
        }
        if (foundLayer) {
            const startPosition = this.startUser(foundLayer as ITiledMapTileLayer, defaultLayerName);
            this.startPosition = {
                x: startPosition.x + this.mapFile.tilewidth / 2,
                y: startPosition.y + this.mapFile.tileheight / 2,
            };
        }
    }

    public getStartPositionNames(): string[] {
        const names: string[] = [];
        for (const layer of this.gameMap.flatLayers) {
            if (layer.name === "start") {
                names.push(layer.name);
                continue;
            }
            if (this.isStartLayer(layer)) {
                names.push(layer.name);
            }
        }
        return names;
    }

    private initPositionFromArea(): boolean {
        const area = this.gameMap.getArea(this.startPositionName);
        if (!area) {
            return false;
        }
        this.startPosition = {
            x: area.x,
            y: area.y,
        };
        return true;
    }

    private initStartXAndStartY() {
        // If there is an init position passed
        if (this.initPosition !== null) {
            this.startPosition = this.initPosition;
        } else {
            // try to get starting position from Area object
            if (!this.initPositionFromArea()) {
                // if cannot, look for Layers
                this.initPositionFromLayerName(this.startPositionName, defaultStartPositionName);
            }
        }
        // Still no start position? Something is wrong with the map, we need a "start" layer.
        if (this.startPosition === undefined) {
            console.warn(
                'This map is missing a layer named "start" that contains the available default start positions.'
            );
            // Let's start in the middle of the map
            this.startPosition = {
                x: this.mapFile.width * 16,
                y: this.mapFile.height * 16,
            };
        }
    }

    private isStartLayer(layer: ITiledMapLayer): boolean {
        return this.getProperty(layer, GameMapProperties.START_LAYER) == true;
    }

    /**
     *
     * @param selectedLayer this is always the layer that is selected with the hash in the url
     * @param selectedOrDefaultLayer  this can also be the default layer if the {selectedLayer} did not yield any start points
     */
    private startUser(selectedOrDefaultLayer: ITiledMapTileLayer, selectedLayer: string | null): PositionInterface {
        const tiles = selectedOrDefaultLayer.data;
        if (typeof tiles === "string") {
            throw new Error("The content of a JSON map must be filled as a JSON array, not as a string");
        }
        const possibleStartPositions: PositionInterface[] = [];
        tiles.forEach((objectKey: number, key: number) => {
            if (objectKey === 0) {
                return;
            }
            const y = Math.floor(key / selectedOrDefaultLayer.width);
            const x = key % selectedOrDefaultLayer.width;

            if (selectedLayer && this.gameMap.hasStartTile) {
                const properties = this.gameMap.getPropertiesForIndex(objectKey);
                if (
                    !properties.length ||
                    !properties.some((property) => property.name == "start" && property.value == selectedLayer)
                ) {
                    return;
                }
            }
            possibleStartPositions.push({ x: x * this.mapFile.tilewidth, y: y * this.mapFile.tilewidth });
        });
        // Get a value at random amongst allowed values
        if (possibleStartPositions.length === 0) {
            console.warn('The start layer "' + selectedOrDefaultLayer.name + '" for this map is empty.');
            return {
                x: 0,
                y: 0,
            };
        }
        // Choose one of the available start positions at random amongst the list of available start positions.
        return possibleStartPositions[Math.floor(Math.random() * possibleStartPositions.length)];
    }

    private getProperty(layer: ITiledMapLayer | ITiledMap, name: string): string | boolean | number | undefined {
        const properties: ITiledMapProperty[] | undefined = layer.properties;
        if (!properties) {
            return undefined;
        }
        const obj = properties.find(
            (property: ITiledMapProperty) => property.name.toLowerCase() === name.toLowerCase()
        );
        if (obj === undefined) {
            return undefined;
        }
        return obj.value;
    }
}
