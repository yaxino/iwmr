
import * as THREE from 'three';
import { MarchingCubes } from '../jsm/objects/MarchingCubes.js';

export class VR {
    //体渲染参数设置
    static MC_RADIUS_STEP = 4;//2 - 4 现阶段4效果最佳
    static MC_CENTER_STEP = 2.65;//2 - 4 现阶段2.5效果最佳
    static MC_SCALE = 11.2;
    static MC_STRENGTH = 0.6;
    constructor() {
        this.points_file = 'json/webgl_marchingcubes_data2.txt';
        this.mcEffects = [];

        this.resolution = 140;//圆润感达到粒子点效果。目前最佳数值
        this.isolation = 80; // 80颜色没有叠加；110-130 ，颜色轮廓更加好看

        this.guiParams = {
            colorArea: 80,
            mcColorArea: 80,
            mcColorSinge: 80,
            mcStrength: VR.MC_STRENGTH,
        };
        let loader = new THREE.FileLoader();
        this.matrix = null;
        loader.load(this.points_file, (data) => {
            const matrix = JSON.parse(data).matrix;
            this.matrix = matrix;
        });
        this.sprite = new THREE.TextureLoader().load('texture/circle.png');


    }
    pointsFill(name, main) {
        let group = new THREE.Group();//创建群组，用来存放封闭层。
        group.name = name;

        const matrix = this.matrix;

        if (main.gui == null) {
            main.gui = new dat.GUI();
        }

        main.gui.add(this.guiParams, 'colorArea', 0, 80, 5).name('颜色区间').onChange((val) => {
            let geometry = main.scene.getObjectByName('pointsFill').children[0].geometry;
            VR.pointsGeo(geometry, val);
        });

        const geometry = new THREE.BufferGeometry();
        geometry.userData.matrix = this.matrix;
        //config.js
        VR.pointsGeo(geometry, this.guiParams.colorArea);

        const material = new THREE.PointsMaterial({
            size: 1, //1.5几乎全部占满。
            vertexColors: true,
            //blending: THREE.NormalBlending,
            transparent: true,
            opacity: 0.8,
            //  depthWrite:false,
            //  map: this.sprite,
        });
        // THREE.NormalBlending:.blending属性默认值
        // THREE.AdditiveBlending:加法融合模式，这种有光反色效果，不建议用。
        // THREE.SubtractiveBlending:减法融合模式
        // THREE.MultiplyBlending:乘法融合模式
        // THREE.CustomBlending:自定义融合模式，与.blendSrc,.blendDst或.blendEquation属性组合使用
        // .blendSrc、.blendSrc、.blendEquation等属性的介绍可以查看Threejs文档材质基类Material

        const points = new THREE.Points(geometry, material);
        points.position.set(-geometry.boundingSphere.center.x, -geometry.boundingSphere.center.y, -geometry.boundingSphere.center.z);
        // points.scale.set(90, 100, 5);

        group.add(points);

        return group;
    }


    marchingCube(name) {
        let group = new THREE.Group();
        group.name = name;
        const matrix = this.matrix;


        const material = new THREE.MeshBasicMaterial({
            // shininess: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        //有几种颜色区间，就应该有多少个 mcEffect。每一个mcEffect的positon+color也可以计算出来
        const xCount = matrix.length;
        const yCount = matrix[0].length;
        const zCount = matrix[0][0].length;
        const center = [Math.floor(xCount / VR.MC_CENTER_STEP), Math.floor(yCount / VR.MC_CENTER_STEP), Math.floor(zCount / VR.MC_CENTER_STEP)]
        let pvs = [];
        for (let x = 0; x < xCount; x++) {
            for (let y = 0; y < yCount; y++) {
                for (let z = 0; z < zCount; z++) {
                    let color = VR.getTempColor(matrix[x][y][z]);
                    if (color != '255,255,255') {
                        if (pvs[color]) {
                            //Z的坐标不要移动，这个调整就是要将X，Y移动到中心位置
                            pvs[color].push([x - center[0], y - center[1], z]);
                        } else {
                            pvs[color] = [];
                        }
                    }
                }
            }
        }
        //初始渲染所有颜色的体
        let mcEffects = [];
        for (var i in pvs) {
            let level = pvs[i].length < 30000 ? 30000: pvs[i].length;
            const mcEffect = new MarchingCubes(this.resolution, material,true, true,
                level);
            mcEffect.isolation = this.isolation;
            //this.mcEffect.position.set(-5, 5, 28);
            mcEffect.scale.set(VR.MC_SCALE, VR.MC_SCALE, VR.MC_SCALE);
            mcEffect.enableUvs = false;
            mcEffect.enableColors = true;
            mcEffect.userData.matrix = pvs[i];
            mcEffect.userData.matrixName = i;
            mcEffect.userData.matrixCount = [xCount, yCount, zCount];
            group.add(mcEffect);
            mcEffects.push(mcEffect);
        }
        VR.mcAddBall(mcEffects);
        group.position.set(0, 0, VR.MC_SCALE - 0.9)


        if (main.gui == null) {
            main.gui = new dat.GUI();
        }
        main.gui.add(this.guiParams, 'mcStrength', 0, 12, 0.1).name('体渲染(强度)').onChange((val) => {
            VR.MC_STRENGTH = val;
            let mcEffects = main.scene.getObjectByName('marchingCube').children;
            //清空，重新渲染
            VR.mcAddBall(mcEffects);
        });
        main.gui.add(this.guiParams, 'mcColorArea', 0, 80, 5).name('体渲染域').onChange((val) => {
            let mcEffects = main.scene.getObjectByName('marchingCube').children;
            //用户限制渲染颜色区间
            VR.mcAddBall(mcEffects, val);
        });
        let selectArr = [];
        for (var i = 0; i <= 80; i = i + 5) {
            selectArr.push(i);
        }
        main.gui.add(this.guiParams, 'mcColorSinge', selectArr).name('体渲染(单色)').onChange((val) => {
            let mcEffects = main.scene.getObjectByName('marchingCube').children;
            //用户限制渲染颜色区间
            VR.mcAddBall(mcEffects, val, true);
        });


        return group;
    }

    static pointsGeo(geometry, limitVal) {
        let matrix = geometry.userData.matrix;
        let pCount = 0;
        for (let mx = 0; mx < matrix.length; mx++) {
            for (let my = 0; my < matrix[mx].length; my++) {
                for (let mz = 0; mz < matrix[mx][my].length; mz++) {
                    if (matrix[mx][my][mz] > 0 && matrix[mx][my][mz] < limitVal) {
                        pCount++;
                    }
                }
            }
        }
        const positions = new Float32Array(pCount * 3);
        let pi = 0;
        const colors = [];
        const step = 0.2;//点的间隔距离
        for (let mx = 0; mx < matrix.length; mx++) {
            for (let my = 0; my < matrix[mx].length; my++) {
                for (let mz = 0; mz < matrix[mx][my].length; mz++) {
                    if (matrix[mx][my][mz] > 0 && matrix[mx][my][mz] < limitVal) {
                        positions[pi] = (mx + 1) * step;
                        positions[pi + 1] = (my + 1) * step;
                        positions[pi + 2] = (mz + 1) * step * 1;
                        pi += 3;

                        const color = new THREE.Color('rgb(' + VR.getTempColor(matrix[mx][my][mz]) + ')');
                        colors.push(color.r, color.g, color.b);
                    }

                }
            }
        }


        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        // geometry.center();
        geometry.computeBoundingSphere();
    }
    static mcAddBall(mcEffects, limitVal, signColor) {

        if (limitVal == null) {
            for (var mc in mcEffects) {
                //高度 层可变代码
                const mcEffect = mcEffects[mc];
                let matrix = mcEffect.userData.matrix;
                let level = mcEffect.userData.matrixCount;
                //扣除
                const subtract = 12;
                //强度
                const strength = VR.MC_STRENGTH / ((Math.sqrt(level[0] * level[1] * level[2]) - 1) / 4 + 1);

                const radius2 = VR.MC_RADIUS_STEP / level[0];
                mcEffect.reset();
                for (var i in matrix) {
                    const ballColor = new THREE.Color('rgb(' + mcEffect.userData.matrixName + ')');
                    mcEffect.addBall((matrix[i][0]) * radius2, (matrix[i][1]) * radius2, (matrix[i][2]) * radius2, strength, subtract, ballColor);

                }
                mcEffect.update();
                //mcEffect.geometry.center();
                mcEffect.geometry.computeBoundingSphere();
                mcEffect.geometry.computeBoundingBox();

            }

        }
        else {
            let limitArr = VR.getTempColorLimitArr(limitVal, signColor);
            for (var mc in mcEffects) {
                //高度 层可变代码
                const mcEffect = mcEffects[mc];

                if (limitArr.indexOf(mcEffect.userData.matrixName) >= 0) {
                    mcEffect.visible = true;
                } else {
                    mcEffect.visible = false;
                }
            }
        }
        //mcEffect.reset();

    }

    static getTempColorLimitArr(limitVal, signColor) {
        var arr = [];
        if (signColor) {
            arr.push(VR.getTempColor(limitVal));
        }
        else {
            for (var i = 5; i <= limitVal; i = i + 5) {
                arr.push(VR.getTempColor(i));
            }
        }


        return arr;
    }
    static getTempColor(temp) {
        let rgbStr = "255,255,255";

        if (temp <= 0.0) { rgbStr = "255,255,255"; return rgbStr; }
        if (temp <= 5 && temp > 0.0) { rgbStr = "0,172,164"; return rgbStr; }
        if (temp <= 10 && temp > 5) { rgbStr = "192,192,254"; return rgbStr; }
        if (temp <= 15 && temp > 10) { rgbStr = "122,114,238"; return rgbStr; }
        if (temp <= 20 && temp > 15) { rgbStr = "30,38,208"; return rgbStr; }
        if (temp <= 25 && temp > 20) { rgbStr = "166,252,168"; return rgbStr; }
        if (temp <= 30 && temp > 25) { rgbStr = "0,234,0"; return rgbStr; }
        if (temp <= 35 && temp > 30) { rgbStr = "16,146,26"; return rgbStr; }
        if (temp <= 40 && temp > 35) { rgbStr = "252,244,100"; return rgbStr; }
        if (temp <= 45 && temp > 40) { rgbStr = "200,200,2"; return rgbStr; }
        if (temp <= 50 && temp > 45) { rgbStr = "140,140,0"; return rgbStr; }
        if (temp <= 55 && temp > 50) { rgbStr = "254,172,172"; return rgbStr; }
        if (temp <= 60 && temp > 55) { rgbStr = "254,100,92"; return rgbStr; }
        if (temp <= 65 && temp > 60) { rgbStr = "238,2,48"; return rgbStr; }
        if (temp <= 75 && temp > 65) { rgbStr = "212,142,254"; return rgbStr; }

        if (temp > 75) { rgbStr = "170,36,250"; return rgbStr; }
        return rgbStr;

    }

}