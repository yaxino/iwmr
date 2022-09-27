
import * as THREE from 'three';
import { LightningStorm } from '../jsm/objects/LightningStorm.js';
//实现局部暴风效果，参考：webgl_postprocessing_unreal_bloom_selective.html
export class BaoFeng {
    constructor(main_scene) {
        this.parent = main_scene;
        this.points = [];
        this.maxPoints = 5000;
        this.colors = [
            new THREE.Color(0xff0000),
            new THREE.Color(0xff7f00),
            new THREE.Color(0xffff00),
            new THREE.Color(0x00ff00),
            new THREE.Color(0x0000ff),
            new THREE.Color(0x4b0082),
            new THREE.Color(0x9400d3)
        ];
        this.storm = null;
        this.pAreaWith = 500;
        this.pointMesh = null;
        this.clock = new THREE.Clock();
        this.currentTime = 0;
        this.pointsGeo = null;
 
    } 
    //随机生成一堆粒子
    spawnParticle() {
        let p, ls;
        let pt = {};
        p = Math.PI * 2 * Math.random();
        ls = Math.sqrt(Math.random() * this.pAreaWith);
        pt.x = Math.sin(p) * ls;
        pt.y = 25 / 2;
        pt.vy = 0.01 / 20 + Math.random() * 0.01;
        pt.z = Math.cos(p) * ls;
        let now = new Date();
        pt.color = this.colors[Math.floor(now.getSeconds() / 10) % 7];

        this.points.push(pt);
    }
    //重新计算粒子位置
    project3D(x, y, z) {
        let p, d;
        // x -= 0;//这三个应该是相机位置
        // y -= 0 - 8;
        // z -= -14;
        p = Math.atan2(x, z);
        d = Math.sqrt(x * x + z * z);
        x = Math.sin(p) * d;
        z = Math.cos(p) * d;
        p = Math.atan2(y, z);
        d = Math.sqrt(y * y + z * z);
        y = Math.sin(p) * d;
        z = Math.cos(p) * d;
        return { x: x, y: y, z: z };
    }
    //运行粒子群。更新闪电效果
    process() {
        if (this.points.length < this.maxPoints) {
            for (let i = 0; i < 5; i++) {
                this.spawnParticle();
            }
        }
        var p, d, t;
        var point, x, y, z, a;
        for (var i = 0; i < this.points.length; ++i) {
            x = this.points[i].x;
            y = this.points[i].y;
            z = this.points[i].z;
            d = Math.sqrt(x * x + z * z) / 1.0045; //原1.0075 ，现在速度变慢，可以达到底部
            t = .1 / (1 + d * d / 5);
            p = Math.atan2(x, z) + t;
            this.points[i].x = Math.sin(p) * d;
            this.points[i].z = Math.cos(p) * d;
            this.points[i].y -= this.points[i].vy * t * ((Math.sqrt(this.pAreaWith) - d) * 2);
            //这里判断，点的y坐标是否达到底部，x、z坐标是否达到中心位置
            if (this.points[i].y < -12 || d < 0.25) {
                this.points.splice(i, 1);
                this.spawnParticle();
            }
        }

        let positions = new Float32Array(this.points.length * 3);
        const colors = [];

        for (var i = 0; i < this.points.length; ++i) {
            x = this.points[i].x;
            y = this.points[i].y;
            z = this.points[i].z;
            point = this.project3D(x, y, z);
            positions[3 * i] = point.x;
            positions[3 * i + 1] = point.y;
            positions[3 * i + 2] = point.z;
            //pointMesh.material[i].map.rotation = Math.abs( Math.PI/point.z);
            //tempC = new THREE.Color( Math.random()* 0xffffff);
            colors.push(this.points[i].color.r, this.points[i].color.g, this.points[i].color.b);
        }
        this.pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.pointsGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        if (this.storm) {
            this.currentTime += 1 * this.clock.getDelta();

            if (this.currentTime < 0) {

                this.currentTime = 0;

            }

            this.storm.update(this.currentTime);
        }
    }
    //创建雷电效果
    create(name) {

        let pmGroup = new THREE.Group();
        pmGroup.name = name;

        //粒子风暴
        this.pointsGeo = new THREE.BufferGeometry();
        const pointsArr = new Float32Array(0);
        this.pointsGeo.setAttribute('position', new THREE.BufferAttribute(pointsArr, 3));

        this.pointsGeo.computeBoundingBox();
        const textureLoader = new THREE.TextureLoader();
        //const sprite1 = textureLoader.load('texture/wind1.png'); 
        const material1 = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            //color:'blue'
            // map: sprite1, 
            // blending: THREE.AdditiveBlending, 
            // depthTest: false, 
            // transparent: true 
        });

        this.pointMesh = new THREE.Points(this.pointsGeo, material1);
        pmGroup.add(this.pointMesh);
        // 闪电效果
        const rayDirection = new THREE.Vector3(0, - 1, 0);
        let rayLength = 0;
        const vec1 = new THREE.Vector3();
        const vec2 = new THREE.Vector3();
        const userData = {
            lightningColor: new THREE.Color(0xB0FFFF),
            outlineColor: new THREE.Color(0x00FFFF),

            lightningMaterial: new THREE.MeshBasicMaterial({ color: new THREE.Color(0xB0FFFF) }),
            rayParams: {

                radius0: 0.1,
                radius1: 0.1,
                minRadius: 0.1,
                maxIterations: 7,

                timeScale: 0.15,
                propagationTimeFactor: 0.2,
                vanishingTimeFactor: 0.9,
                subrayPeriod: 4,
                subrayDutyCycle: 0.6,

                maxSubrayRecursion: 3,
                ramification: 3,
                recursionProbability: 0.4,

                roughness: 0.85,//闪电的粗糙度
                straightness: 0.65, //闪电的笔直度

                onSubrayCreation: function (segment, parentSubray, childSubray, lightningStrike) {

                    lightningStrike.subrayConePosition(segment, parentSubray, childSubray, 0.6, 0.6, 0.5);

                    // Plane projection

                    rayLength = lightningStrike.rayParameters.sourceOffset.y;
                    vec1.subVectors(childSubray.pos1, lightningStrike.rayParameters.sourceOffset);
                    const proj = rayDirection.dot(vec1);
                    vec2.copy(rayDirection).multiplyScalar(proj);
                    vec1.sub(vec2);
                    const scale = proj / rayLength > 0.5 ? rayLength / proj : 1;
                    vec2.multiplyScalar(scale);
                    vec1.add(vec2);
                    childSubray.pos1.addVectors(vec1, lightningStrike.rayParameters.sourceOffset);

                }

            }
        }
 
        const starVertices = [];
        const prevPoint = new THREE.Vector3(0, 0, 1);
        const currPoint = new THREE.Vector3();
        for (let i = 1; i <= 16; i++) {

            currPoint.set(Math.sin(2 * Math.PI * i / 16), 0, Math.cos(2 * Math.PI * i / 16));

            if (i % 2 === 1) {

                currPoint.multiplyScalar(0.3);

            }

            starVertices.push(0, 0, 0);
            starVertices.push(prevPoint.x, prevPoint.y, prevPoint.z);
            starVertices.push(currPoint.x, currPoint.y, currPoint.z);

            prevPoint.copy(currPoint);

        }

        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const starMesh = new THREE.Mesh(starGeometry, new THREE.MeshBasicMaterial({ color: 0x020900, transparent: true, opacity: 0.0 }));
        starMesh.scale.multiplyScalar(6);

        //闪电对象 
        this.storm = new LightningStorm({
            size: 10, //控制落雷范围，数值越大，范围越大
            minHeight: 10,
            maxHeight: 30,
            maxSlope: 0.6, //落雷斜坡，角度
            maxLightnings: 3,//默认8，落雷多少的频率。

            lightningParameters: userData.rayParams,

            lightningMaterial: userData.lightningMaterial,

            onLightningDown: function (lightning) {

                // Add black star mark at ray strike
                const star1 = starMesh.clone();
                star1.position.copy(lightning.rayParameters.destOffset);
                star1.position.y = 0.05;
                star1.rotation.y = 2 * Math.PI * Math.random();
                pmGroup.add(star1);

            }

        });
        
        pmGroup.add(this.storm);
        return pmGroup;
    }

}