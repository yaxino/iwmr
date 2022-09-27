

import * as THREE from 'three';
import { OrbitControls } from '../jsm/controls/OrbitControls.js';
import { EffectComposer } from '../jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from '../jsm/postprocessing/AfterimagePass.js';
import SpriteText from 'three-spritetext';

// import { OutlinePass } from '../jsm/postprocessing/OutlinePass.js';
// import { FXAAShader } from '../jsm/shaders/FXAAShader.js';

export class MainScene {

    constructor(showAxes) {
        this.div = MAIN_DIV;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, CAMERA_ASPECT, CAMERA_NEAR, CAMERA_FAR);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.ambientLight = new THREE.AmbientLight(COLOR_WHITE); // 环境光,白光

        this.camera.position.set(5, 0, 30);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.div.offsetWidth, this.div.offsetHeight);
        this.renderer.localClippingEnabled = true;
        this.renderer.setAnimationLoop(this.animate.bind(this));
        this.scene.add(this.ambientLight);

        this.div.appendChild(this.renderer.domElement);
        this.control = new OrbitControls(this.camera, this.renderer.domElement);//添加鼠标滚动缩放，旋转对象
        this.control.mouseButtons = {
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE
        }
        this.gui = null;
        //通道
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        let afterimagePass = new AfterimagePass();
        this.composer.addPass(afterimagePass);
        afterimagePass.uniforms['damp'] = { value: 0.0 };
 
        this.setResize();
        this.funAnimates = [];//初始化自定义动画函数集合。
        this.groupNames = [];//初始化场景分组名称
        
        this.setAxes(showAxes);
    }
    setAxes(showAxes) {

        if (showAxes) {
            const textGroup = new THREE.Group();
            let axes = new THREE.AxesHelper(AXES_SIZE);
            textGroup.add(axes);
            //X,Y,Z轴刻度文字
            for (var i = 1; i <= AXES_SIZE; i++) {
                textGroup.add(MainScene.ADD_TEXT(i + '00', { x: i, y: 0, z: 0 }, true));
                textGroup.add(MainScene.ADD_TEXT(i + '00', { x: 0, y: i, z: 0 }, true));
                textGroup.add(MainScene.ADD_TEXT(i + '00', { x: 0, y: 0, z: i }, true));
            }
            //textGroup.position.set(-AXES_SIZE / 2, -AXES_SIZE / 2, 0);
            this.scene.add(textGroup);
        }
    }
    setResize() {
        const _this = this;
        window.addEventListener('resize', function () {
            _this.renderer.setSize(window.innerWidth, window.innerHeight);
            _this.composer.setSize(window.innerWidth, window.innerHeight);
        })
    }
    //外部loop 动画方法
    animate() {
        // requestAnimationFrame(this.animate.bind(this));
        if (this.funAnimates) {
            for (let i = 0; i < this.funAnimates.length; i++) {
                this.funAnimates[i](this);
            }
        }
        this.composer.render();
    }
    addObj(obj, funAnimate) {
        let group = this.scene.getObjectByName(obj.name);
        if (group) {
            this.scene.remove(group);

        }

        this.scene.add(obj);

        if (funAnimate && this.funAnimates.indexOf(funAnimate) < 0) {
            this.funAnimates.push(funAnimate);
        }
    }
    //动态对象，需要移除，再创建。
    delObj(name) {
        let group = this.scene.getObjectByName(name);
        if (group) {
            this.scene.remove(group);

        }
    }
    //静态对象设置visible
    hideObj(name, show) {
        let group = this.scene.getObjectByName(name);
        if (group) {
            group.visible = show;

        }
    }


    static ADD_TEXT(text, position, showBox, color, height) {
        const group = new THREE.Object3D();
        const sprite = new SpriteText(text);
        sprite.color = color ? color : 'white';
        let half_height = 0.05;
        let h = height ? height : (2 * half_height);
        sprite.textHeight =h;
        half_height = h/2;
        // sprite.fontSize = 30;
        sprite.position.x = position.x - half_height;
        sprite.position.y = position.y - half_height;
        sprite.position.z = position.z;
        group.add(sprite);
        if (showBox) {
            const sphere = new THREE.SphereGeometry(0.01);
            const box = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: (color ? color : 'white') }));
            box.position.set(position.x, position.y, position.z)
            group.add(box);
        }
        return group;
    }
}