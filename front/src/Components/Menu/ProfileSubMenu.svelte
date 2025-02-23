<script lang="ts">
    import { gameManager } from "../../Phaser/Game/GameManager";
    import { SelectCompanionScene, SelectCompanionSceneName } from "../../Phaser/Login/SelectCompanionScene";
    import {
        menuIconVisiblilityStore,
        menuVisiblilityStore,
        userIsConnected,
        profileAvailable,
        getProfileUrl,
    } from "../../Stores/MenuStore";
    import { selectCompanionSceneVisibleStore } from "../../Stores/SelectCompanionStore";
    import { LoginScene, LoginSceneName } from "../../Phaser/Login/LoginScene";
    import { loginSceneVisibleStore } from "../../Stores/LoginSceneStore";
    import { selectCharacterSceneVisibleStore } from "../../Stores/SelectCharacterStore";
    import { SelectCharacterScene, SelectCharacterSceneName } from "../../Phaser/Login/SelectCharacterScene";
    import { connectionManager } from "../../Connexion/ConnectionManager";
    import { EnableCameraScene, EnableCameraSceneName } from "../../Phaser/Login/EnableCameraScene";
    import { enableCameraSceneVisibilityStore } from "../../Stores/MediaStore";
    import btnProfileSubMenuCamera from "../images/btn-menu-profile-camera.svg";
    import btnProfileSubMenuIdentity from "../images/btn-menu-profile-identity.svg";
    import btnProfileSubMenuCompanion from "../images/btn-menu-profile-companion.svg";
    import Woka from "../Woka/Woka.svelte";
    import Companion from "../Companion/Companion.svelte";
    import LL from "../../i18n/i18n-svelte";
    import { analyticsClient } from "../../Administration/AnalyticsClient";
    import { ENABLE_OPENID } from "../../Enum/EnvironmentVariable";

    function disableMenuStores() {
        menuVisiblilityStore.set(false);
        menuIconVisiblilityStore.set(false);
    }

    function openEditCompanionScene() {
        disableMenuStores();
        selectCompanionSceneVisibleStore.set(true);
        gameManager.leaveGame(SelectCompanionSceneName, new SelectCompanionScene());
    }

    function openEditNameScene() {
        disableMenuStores();
        loginSceneVisibleStore.set(true);
        gameManager.leaveGame(LoginSceneName, new LoginScene());
    }

    function openEditSkinScene() {
        disableMenuStores();
        selectCharacterSceneVisibleStore.set(true);
        gameManager.leaveGame(SelectCharacterSceneName, new SelectCharacterScene());
    }

    async function logOut() {
        disableMenuStores();
        return connectionManager.logout();
    }

    function openEnableCameraScene() {
        disableMenuStores();
        enableCameraSceneVisibilityStore.showEnableCameraScene();
        gameManager.leaveGame(EnableCameraSceneName, new EnableCameraScene());
    }
</script>

<div class="customize-main">
    <div class="submenu">
        <section class="centered-column resizing-width tw-m-auto resizing-text">
            <button
                type="button"
                class="tw-w-full outline tw-min-w-[220px]"
                on:click={() => analyticsClient.editName()}
                on:click={openEditNameScene}
            >
                <img
                    draggable="false"
                    src={btnProfileSubMenuIdentity}
                    alt={$LL.menu.profile.edit.name()}
                    width="26px"
                    height="26px"
                    class="darken-icon"
                />
                <span class="">{$LL.menu.profile.edit.name()}</span>
            </button>
            <button
                type="button"
                class="tw-w-full outline tw-min-w-[220px]"
                on:click={() => analyticsClient.editWoka()}
                on:click={openEditSkinScene}
            >
                <Woka userId={-1} placeholderSrc="" width="26px" height="26px" />
                <span class="">{$LL.menu.profile.edit.woka()}</span>
            </button>
            <button
                type="button"
                class="tw-w-full outline tw-min-w-[220px]"
                on:click={() => analyticsClient.editCompanion()}
                on:click={openEditCompanionScene}
            >
                <Companion userId={-1} placeholderSrc={btnProfileSubMenuCompanion} width="26px" height="26px" />
                <span class="">{$LL.menu.profile.edit.companion()}</span>
            </button>
            <button
                type="button"
                class="tw-w-full outline tw-min-w-[220px]"
                on:click={() => analyticsClient.editCamera()}
                on:click={openEnableCameraScene}
            >
                <img
                    draggable="false"
                    src={btnProfileSubMenuCamera}
                    alt={$LL.menu.profile.edit.camera()}
                    width="26px"
                    height="26px"
                    class="darken-icon"
                />
                <span class="">{$LL.menu.profile.edit.camera()}</span>
            </button>
        </section>
    </div>

    <div class="content">
        <section class="centered-column tw-w-full tw-m-auto resizing-text">
            {#if $profileAvailable}
                <iframe
                    title="profile"
                    src={getProfileUrl()}
                    class="tw-w-4/5 tw-h-screen tw-border-0 tw-border-solid tw-border-light-blue"
                />
            {/if}
            {#if ENABLE_OPENID}
                {#if $userIsConnected}
                    <button
                        type="button"
                        class="btn outline resizing-width tw-justify-center"
                        on:click={() => analyticsClient.logout()}
                        on:click={logOut}>{$LL.menu.profile.logout()}</button
                    >
                {:else}
                    <a
                        type="button"
                        class="btn light resizing-width tw-justify-center"
                        href="/login"
                        on:click={() => analyticsClient.login()}
                    >
                        {$LL.menu.profile.login()}</a
                    >
                {/if}
            {/if}
        </section>
    </div>
</div>
