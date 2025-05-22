import { ImageSource, Resource, Loader, Sound } from 'excalibur'

// Game resources
const Resources = {
    Fish1: new ImageSource('images/fish1.png'),
    Fish2: new ImageSource('images/fish2.png'),
    FishRare: new ImageSource('images/fish_rare.png'),
    Trash: new ImageSource('images/trash.png'),
    ShadowTrash: new ImageSource('images/shadow_trash.png'),
    Dobber: new ImageSource('images/dopper.png'),
    Background: new ImageSource('images/background.png'),
    ShadowFish1: new ImageSource('images/shadow_fish1.png'),
    ShadowFish2: new ImageSource('images/shadow_fish2.png'),
    ShadowRare: new ImageSource('images/shadow_rare.png'),
    // Sound resources
    DobberSplash: new Sound('sounds/dobbersplash.wav'),
    FishCaught: new Sound('sounds/fishcaught.wav'),
    TrashSound: new Sound('sounds/trash.wav')
}

const ResourceLoader = new Loader()
for (let res of Object.values(Resources)) {
    ResourceLoader.addResource(res)
}

export { Resources, ResourceLoader }