import * as THREE from 'three';
export class CutPlane {
    constructor() {

        this.planes = [
            new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
            new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
            new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)
        ]
        this.params = {
            '自动旋转': true,//自动旋转
            planeX: {
                constant: 0,
                negated: false,
                displayHelper: false
            },
            planeY: {
                constant: 0,
                negated: false,
                displayHelper: false
            },
            planeZ: {
                constant: 0,
                negated: false,
                displayHelper: false
            }
        };
    }
    create(name, mesh, gui) {
        //将传入mesh 设置clippingPlanes ，clipIntersection
        mesh.material.clippingPlanes = this.planes;
        mesh.material.clipIntersection = false;

        const group = new THREE.Group();
        group.name = name;
        const planeHelpers = this.planes.map(p => new THREE.PlaneHelper(p, 20, 0xffffff));
        planeHelpers.forEach(ph => {
            ph.visible = false;
            //ph.position.set(5,5,0);
            group.add(ph);
        });
        // Set up clip plane rendering
        // GUI
        if (gui == null) {
            gui = new dat.GUI();
        }
        if (gui.__folders['X面'] == undefined) {
            const planeX = gui.addFolder('X面');
            planeX.add(this.params.planeX, 'displayHelper').onChange(v => {
                this.planes[0].visible = v
            }
                ).name("显示");
            planeX.add(this.params.planeX, 'constant').min(- 10).max(10).name("范围").onChange(d => this.planes[0].constant = d);
            planeX.add(this.params.planeX, 'negated').name("反面").onChange(() => {

                this.planes[0].negate();
                this.params.planeX.constant = this.planes[0].constant;

            });
            planeX.open();

            const planeY = gui.addFolder('Y面');
            planeY.add(this.params.planeY, 'displayHelper').name("显示").onChange(v => planeHelpers[1].visible = v);
            planeY.add(this.params.planeY, 'constant').min(- 10).max(10).name("范围").onChange(d => this.planes[1].constant = d);
            planeY.add(this.params.planeY, 'negated').name("反面").onChange(() => {

                this.planes[1].negate();
                this.params.planeY.constant = this.planes[1].constant;

            });
            planeY.open();

            const planeZ = gui.addFolder('Z面');
            planeZ.add(this.params.planeZ, 'displayHelper').name("显示").onChange(v => planeHelpers[2].visible = v);
            planeZ.add(this.params.planeZ, 'constant').min(- 10).max(10).step(0.2).name("范围").onChange(d => this.planes[2].constant = d);
            planeZ.add(this.params.planeZ, 'negated').name("反面").onChange(() => {

                this.planes[2].negate();
                this.params.planeZ.constant = this.planes[2].constant;

            });
            planeZ.open();
        }
        return group;

    }

}