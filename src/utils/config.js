/*
主场景配置参数
*/
const CAMERA_FOV = 15;//摄像机视锥体垂直视野角度
const CAMERA_ASPECT = window.innerWidth / window.innerHeight;// 摄像机视锥体长宽比
const CAMERA_NEAR = 1;//摄像机视锥体近端面
const CAMERA_FAR = 10000;//摄像机视锥体远端面
const COLOR_WHITE = 0xffffff;
const AXES_SIZE = 6;

const MAIN_DIV = document.body;
MAIN_DIV.style.height = window.innerHeight + 'px';


const ADD_TEXT = function (text, position, showBox, color, height,) {
    const group = new THREE.Group();
    const sprite = new SpriteText(text);
    sprite.color = color ? color : 'white';
    const half_height = 0.05;
    sprite.textHeight = height ? height : 2 * half_height;
    sprite.position.x = position.x - half_height;
    sprite.position.y = position.y - half_height;
    sprite.position.z = position.z - half_height;
    group.add(sprite);
    if (showBox) {
        const sphere = new THREE.SphereGeometry(0.01);
        const box = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: (color ? color : 'white') }));
        box.position.set(position.x, position.y, position.z)
        group.add(box);
    }
    return group;
}
 