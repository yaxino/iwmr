
import * as THREE from 'three';
import { MathUtils } from 'three'
import { Group } from 'three';
import { ParametricGeometry } from '../jsm/geometries/ParametricGeometry.js';
import { MainScene } from './main_scene.js';
export class Earth3D {
    constructor() {
        this.earth_large_path = 'texture/earth_large.png';
        this.earth_normal_path = 'texture/earth_normal_2048.jpg';
        this.earth_specular_path = 'texture/earth_specular_2048.jpg';
        //this.earth_shape_file = 'json/land-50m.json';
        //this.earth_shape_file = 'json/countries-50m.json';
        //this.earth_shape_file = 'json/world.json';
        this.earth_shape_file = 'json/world_2.json';
        this.guiParams = {
            currProjectionName: Earth3D.currProjectionName
        };
    }
    //显示球体经纬度
    qiutiJW(name) {

        let qiutiGroup = new THREE.Group();
        qiutiGroup.name = name;

        //球体Mesh
        let qiutiGeo = new THREE.SphereBufferGeometry(3, 36, 12);//创建一个球

        // 立方体几何体box作为EdgesGeometry参数创建一个新的几何体
        let edges = new THREE.EdgesGeometry(qiutiGeo);
        const edgesPosArr = qiutiGeo.getAttribute('position').array;
        const edgesGroup = new Group();
        for (let i = 0; i < edgesPosArr.length; i = i + 3) {
            const [lat, log] = Earth3D.xyzlon2(edgesPosArr[i], edgesPosArr[i + 1], edgesPosArr[i + 2]);
            //console.log(lat,log);
            edgesGroup.add(MainScene.ADD_TEXT("[" + lat + "," + log + "]",
                { x: edgesPosArr[i] + 0.01, y: edgesPosArr[i + 1] + 0.01, z: edgesPosArr[i + 2] }, false
                , null, 0.02));
        }
        qiutiGroup.add(edgesGroup);
        // 立方体线框，不显示中间的斜线
        let edgesMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
        })
        let line = new THREE.LineSegments(edges, edgesMaterial);
        //line.material.depthTest = false;
        line.material.opacity = 0.2;
        line.material.transparent = true;
        qiutiGroup.add(line);

        let textureLoader = new THREE.TextureLoader();
        // let surfaceMap = textureLoader.load("texture/earth_atmos_4096.jpg");//创建颜色贴图
        let surfaceMap = textureLoader.load(this.earth_large_path);//创建颜色贴图
        let normalMap = textureLoader.load(this.earth_normal_path);//创建法线贴图
        let specularMap = textureLoader.load(this.earth_specular_path);//创建高光贴图
        let material = new THREE.MeshPhongMaterial({

            map: surfaceMap,
            normalMap: normalMap,
            normalScale: new THREE.Vector2(1.2, 1.2),
            // displacementMap: normalMap,
            // displacementScale: 0.5,
            specularMap: specularMap
        });
        let cube = new THREE.Mesh(qiutiGeo, material);//将几何体和材料放到网格中

        qiutiGroup.add(cube);

        return qiutiGroup;
    }
    qiutiJWMercator(name) {

        let pmGroup = new THREE.Group();
        pmGroup.name = name;

        let loader = new THREE.FileLoader();
        let _this = this;
        loader.load(this.earth_shape_file, function (data) {
            let jsonData = JSON.parse(data);
            // jsonData = topojson.feature(jsonData, jsonData.objects.countries)
            // 建一个空对象存放对象
            let map = new THREE.Object3D();
            const earthR = 3;
            jsonData.features.forEach(elem => {
                // 定一个省份3D对象
                const countries = new THREE.Object3D();
                const province = new THREE.Object3D();
                // 每个的 坐标 数组
                const coordinates = elem.geometry.coordinates;
                // 循环坐标数组
                coordinates.forEach(mutiPolygon => {
                    if (mutiPolygon.length > 0 && mutiPolygon[0].length == 2 && !isNaN(mutiPolygon[0][0])) {
                        //这应该是个国家的轮廓吧！ 
                        const pointsArray = new Array();
                        for (let i = 0; i < mutiPolygon.length; i++) {
                            const point = Earth3D.lon2xyz(earthR, mutiPolygon[i][0], mutiPolygon[i][1]);
                            pointsArray.push(new THREE.Vector3(point.x, point.y, point.z));
                        }
                        countries.add(Earth3D.drawPolygon(pointsArray))
                    }
                    else {


                        mutiPolygon.forEach(polygon => {
                            const shape = new THREE.Shape();
                            const pointsArray = new Array();
                            for (let i = 0; i < polygon.length; i++) {
                                const point = Earth3D.lon2xyz(earthR, polygon[i][0], polygon[i][1]);
                                pointsArray.push(new THREE.Vector3(point.x, point.y, point.z));
                                if (i === 0) {
                                    shape.moveTo(point.x, -point.y);
                                }
                                shape.lineTo(point.x, -point.y);
                            }
                            province.add(Earth3D.drawArea2(pointsArray));
                            province.add(Earth3D.drawPolygon(pointsArray))

                        })
                    }
                })
                map.add(countries);
                map.add(province);

            })

            pmGroup.add(map);

        });
        return pmGroup;
    }
    static drawPolygon(pointsArray) {
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 'white'
        });
        const lineGeometry = new THREE.BufferGeometry();

        lineGeometry.setFromPoints(pointsArray)
        const line = new THREE.Line(lineGeometry, lineMaterial);
        return line;
    }
    static drawArea(shape, depth) {

        const extrudeSettings = {
            depth: depth ? depth : 0.1,
            bevelEnabled: false
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        const material = new THREE.MeshBasicMaterial({
            color: '#02A1E2',
            transparent: true,
            opacity: 0.6
        });
        const material1 = new THREE.MeshBasicMaterial({
            color: 'red',
            transparent: true,
            opacity: 0.5
        });
        const mesh = new THREE.Mesh(geometry, [material, material1]);
        return mesh;
    }
    static drawArea2(points) {
        let idx = 0;
        function area(u, v, target) {
            let x, y, z;

            x = points[idx].x;
            y = points[idx].y;
            z = points[idx].z;
            idx++;
            target.set(x, y, z);
        }
        const geometry = new ParametricGeometry(area, 5, 5);

        const material = new THREE.MeshBasicMaterial({
            color: '#02A1E2',
            transparent: true,
            opacity: 0.6
        });
        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }
    static lon2xyz(radius, longitude, latitude) {
        if (isNaN(longitude)) {
            console.log('什么？' + longitude);
        }
        longitude = parseFloat(longitude);
        latitude = parseFloat(latitude);
        var lon = (longitude * Math.PI) / 180; //转弧度值
        var lat = (latitude * Math.PI) / 180; //转弧度值
        lon = -lon; // three.js坐标系z坐标轴对应经度-90度，而不是90度

        // 经纬度坐标转球面坐标计算公式
        var x = radius * Math.cos(lat) * Math.cos(lon);
        var y = radius * Math.sin(lat);
        var z = radius * Math.cos(lat) * Math.sin(lon);
        // 返回球面坐标
        return {
            x: x,
            y: y,
            z: z,
        };
    }

    static xyzlon2(x, y, z) {
        const spherical = new THREE.Spherical();
        spherical.setFromCartesianCoords(x, y, z);
        return [(spherical.theta / Math.PI * 180).toFixed(1), -(spherical.phi / Math.PI * 180 - 90).toFixed(1), spherical.radius]
    }


    pingmianJW(name) {
        let pmGroup = new THREE.Group();
        pmGroup.name = name;
        //球体Mesh
        let pmGeo = new THREE.PlaneBufferGeometry(20, 10, 36, 18);

        let textureLoader = new THREE.TextureLoader();

        let surfaceMap = textureLoader.load(this.earth_large_path);//创建颜色贴图
        let normalMap = textureLoader.load(this.earth_normal_path);//创建法线贴图
        let material = new THREE.MeshPhongMaterial({
            map: surfaceMap,
            normalMap: normalMap,
            normalScale: new THREE.Vector2(3, 3),
            displacementMap: normalMap,
            displacementScale: 1.5,
        });
        material.needsUpdate = true;
        let cube = new THREE.Mesh(pmGeo, material);//将几何体和材料放到网格中
        pmGroup.add(cube);

        const gridLeftHelper = new THREE.GridHelper(10, 18, 0x808080, 0x808080);
        gridLeftHelper.rotateX(Math.PI / 2);
        gridLeftHelper.position.x = -5;
        pmGroup.add(gridLeftHelper);
        const gridRightHelper = new THREE.GridHelper(10, 18, 0x808080, 0x808080);
        gridRightHelper.rotateX(Math.PI / 2);
        gridRightHelper.position.x = 5;
        pmGroup.add(gridRightHelper);

        return pmGroup;

    }
    pingmianJWMercator(name) {
        let pmGroup = new THREE.Group();
        pmGroup.name = name;
        // const gridLeftHelper = new THREE.GridHelper(36, 36, 0x808080, 0x808080);
        // gridLeftHelper.rotateX(Math.PI / 2);
        // pmGroup.add(gridLeftHelper);
        //路径Mercator投影地图绘制
        let loader = new THREE.FileLoader();
        loader.load(this.earth_shape_file, function (data) {
            let jsonData = JSON.parse(data);
            // jsonData = topojson.feature(jsonData, jsonData.objects.countries)
            // // 建一个空对象存放对象
            let map = new THREE.Object3D();
            //投影转换
            //const projection = d3.geoMercator();
            const projection =
                Earth3D.getProjection(Earth3D.currProjectionName).scale(2).translate([0, 0]);
            //先画网格线。
            const gridGroup = new THREE.Object3D();
            const graticule = d3.geoGraticule10();
            graticule.coordinates.forEach(polygon => {

                let pointsArray = new Array();
                const lineDeep = -0.1;
                for (let i = 0; i < polygon.length; i++) {
                    const [x, y] = projection(polygon[i]);
                    //加经纬度文字，每四个点，设置一个文字
                    if (polygon.length == 3 || i % 4 == 0) {
                        gridGroup.add(MainScene.ADD_TEXT("[" + polygon[i][0].toFixed(1) + "," + polygon[i][1].toFixed(1) + "]",
                            { x: x, y: y, z: lineDeep }, false
                            , null, 0.02));
                    }
                    pointsArray.push(new THREE.Vector3(x, -y, lineDeep));
                }
                if (pointsArray.length < 100) {
                    var curve = new THREE.CatmullRomCurve3(pointsArray);
                    //getPoints是基类Curve的方法，返回一个vector3对象作为元素组成的数组
                    pointsArray = curve.getPoints(100); //分段数100，返回101个顶点

                }

                gridGroup.add(Earth3D.drawPolygon(pointsArray));

            });
            pmGroup.add(gridGroup);
            jsonData.features.forEach(elem => {
                // 定一个省份3D对象
                const province = new THREE.Object3D();
                // 每个的 坐标 数组
                const coordinates = elem.geometry.coordinates;
                // 循环坐标数组
                coordinates.forEach(multiPolygon => {
                    const depthEx = Math.random() * 0.36;

                    if (multiPolygon.length > 0 && multiPolygon[0].length == 2 && !isNaN(multiPolygon[0][0])) {
                        const shape = new THREE.Shape();
                        const pointsArray = new Array();
                        for (let i = 0; i < multiPolygon.length; i++) {
                            const [x, y] = projection(multiPolygon[i]);
                            if (i === 0) {
                                shape.moveTo(x, -y);
                            }
                            shape.lineTo(x, -y);
                            pointsArray.push(new THREE.Vector3(x, -y, depthEx));
                        }
                        province.add(Earth3D.drawArea(shape, depthEx));
                        province.add(Earth3D.drawPolygon(pointsArray))
                    }
                    else {

                        //这应该是个国家的轮廓吧！
                        multiPolygon.forEach(polygon => {
                            const shape = new THREE.Shape();
                            const pointsArray = new Array();
                            for (let i = 0; i < polygon.length; i++) {
                                const [x, y] = projection(polygon[i]);
                                if (i === 0) {
                                    shape.moveTo(x, -y);
                                }
                                shape.lineTo(x, -y);
                                pointsArray.push(new THREE.Vector3(x, -y, depthEx));
                            }
                            province.add(Earth3D.drawArea(shape, depthEx));
                            province.add(Earth3D.drawPolygon(pointsArray))

                        })
                    }
                })

                // 将geo的属性放到省份模型中
                province.properties = elem.properties;
                if (elem.properties.contorid) {
                    const [x, y] = projection(elem.properties.contorid);
                    province.properties._centroid = [x, y];
                }

                map.add(province);

            })

            pmGroup.add(map);
        });
        return pmGroup;
    }

    static currProjectionName = 'Mercator';
    static projectionNames = [
        'AzimuthalEqualArea',      //“方位相等面积”，    
        'AzimuthalEquidistant', //“方位等距”，
        'Gringorten', //“格林戈滕正方形等面积投影，重新排列以给每个半球一个完整的正方形。”，
        'North-Stereographic',//“北极赤平图”，
        'South-Stereographic',//“南极赤平图”，
        'Orthographic',//“正交”，
        'Mercator',//“墨卡托”，
        'Miller',//“Miller圆柱投影是一种改进的Mercator投影。”，
        'TransverseMercator',//“横向球面墨卡托投影。”，
        'EqualEarth',//“等地球”，
        'Airy',//“Airy最小误差方位投影。”，
        'ConicConformal',//“圆锥共形”，
        'ConicEqualArea',//“圆锥等面积”，
        'CylindricalEqualArea',//“圆柱等面积”，
        'FoucautSinusoidal',//“Foucaut正弦投影，正弦投影和Lambert圆柱投影的等面积平均值。”，
        'ConicEquidistant',//“圆锥等距”，
        'Equirectangular',//“等矩形”，
        'HammerRetroazimuthal',//“锤子后方位投影”，
        'Polyconic',               //“多圆锥投影”，  
    ];
    static getProjection(name) {
        let projection = null;
        name = 'geo' + name;
        switch (name) {
            case 'geoAzimuthalEqualArea':
                //The Lambert azimuthal方位角 equal-area projection. 有南北极选项
                projection = d3.geoAzimuthalEqualArea().rotate([0, -90]);
                break;
            case 'geoAzimuthalEquidistant':
                //The   azimuthal方位角等距投影 projection. 有南北极选项
                projection = d3.geoAzimuthalEquidistant().rotate([0, -90]);
                break;
            case 'geoOrthographic':
                //正交投影，  有南北极选项
                projection = d3.geoOrthographic().rotate([0, -90]);
                break;
            case 'geoGringorten':
                projection = d3.geoGringorten();
                break;
            case 'geoNorth-Stereographic':
                //球极平面投影 ,极射投影，极射赤面投影法
                let width = window.innerWidth;
                let height = Math.max(640, width);
                projection = d3.geoStereographic().rotate([0, -90])
                // .scale(width / 4)
                // .translate([width / 2, height / 2])
                // .rotate([-27, 0])
                // .clipAngle(180 - 1e-4)
                // .clipExtent([[0, 0], [width, height]])
                // .precision(0.2);
                break;
            case 'geoSouth-Stereographic':
                //球极平面投影 ,极射投影，极射赤面投影法 
                projection = d3.geoStereographic().rotate([0, 90])
                break;
            case 'geoEqualEarth':
                projection = d3.geoEqualEarth();
                break;
            case 'geoAiry':
                projection = d3.geoAiry();
                break;
            case 'geoConicConformal':
                //The Lambert conformal conic共形二次曲线 projection.
                projection = d3.geoConicConformal();
                break;
            case 'geoConicEqualArea':
                //Albers’ conic equal-area projection.
                projection = d3.geoConicEqualArea();
                break;
            case 'geoCylindricalEqualArea':
                //兰伯特投影的一种, 圆柱等面积投影
                projection = d3.geoCylindricalEqualArea();
                break;
            case 'geoFoucautSinusoidal':
                projection = d3.geoFoucautSinusoidal();
                break;

            case 'geoConicEquidistant':
                projection = d3.geoConicEquidistant();
                break;
            case 'geoEquirectangular':
                //等矩形投影，等经纬度投影
                projection = d3.geoEquirectangular().rotate([100, 40]);
                break;
            case 'geoTransverseMercator':
                //横向球面墨卡托投影。
                projection = d3.geoTransverseMercator();
                break;
            case 'geoHammerRetroazimuthal':
                projection = d3.geoHammerRetroazimuthal();
                break;
            case 'geoMiller':
                projection = d3.geoMiller();
                break;

            case 'geoPolyconic':
                //多圆锥投影
                projection = d3.geoPolyconic();
                break;

            default:
                projection = d3.geoMercator();
                break;
        }
        return projection;
    }

    map3D(name, main) {
        let textureLoader = new THREE.TextureLoader();
        const map = textureLoader.load('texture/gis_map/g1_3096.jfif');

        //灰度计算公式
        // vec4 tColor = texture2D(texture,vUv);
        // float luminance = 0.299*tColor.r+0.587*tColor.g+0.114&tColor.b;
        // gl_FragColor = vec4(luminance,luminance,luminance,1);

        let pmGroup = new THREE.Group();
        pmGroup.name = name;
        //球体Mesh
        let pmGeo = new THREE.PlaneBufferGeometry(5, 5, 36, 18);
        const map2 = textureLoader.load('texture/gis_map/huidu1.png');
        let material = new THREE.MeshPhongMaterial({
            map: map,
            normalMap: map2,
            normalScale: new THREE.Vector2(3, 3),
            displacementMap: map2,
            displacementScale: 2.5,
        });
        let cube2 = new THREE.Mesh(pmGeo, material);//将几何体和材料放到网格中
        pmGroup.add(cube2);
        return pmGroup;

    }

}

