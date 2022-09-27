
import { Pass } from './Pass.js';

class PlanToSherePass extends Pass {

	constructor( radius ) {

		super();
 
        this.shader = BaseShader;

		this.uniforms = UniformsUtils.clone( this.shader.uniforms );

		this.uniforms[ 'radius' ].value = radius;

		this.textureComp = new WebGLRenderTarget( window.innerWidth, window.innerHeight, {
			magFilter: NearestFilter,
		} );

		this.textureOld = new WebGLRenderTarget( window.innerWidth, window.innerHeight, {
			magFilter: NearestFilter,
		} );

		this.shaderMaterial = new ShaderMaterial( {

			uniforms: this.uniforms,
			vertexShader: this.shader.vertexShader,
			fragmentShader: this.shader.fragmentShader

		} );

		this.compFsQuad = new FullScreenQuad( this.shaderMaterial );

		const material = new MeshBasicMaterial();
		this.copyFsQuad = new FullScreenQuad( material );

	}

	render( renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */ ) {
        this.uniforms[ 'tOld' ].value = this.textureOld.texture;
		this.uniforms[ 'tNew' ].value = readBuffer.texture;

		let oldClearAlpha;

		if ( this.clearColor ) {

			renderer.getClearColor( this._oldClearColor );
			oldClearAlpha = renderer.getClearAlpha();

			renderer.setClearColor( this.clearColor, this.clearAlpha );

		}

		renderer.setRenderTarget( this.renderToScreen ? null : readBuffer );
		renderer.clear();

		if ( this.clearColor ) {

			renderer.setClearColor( this._oldClearColor, oldClearAlpha );

		}

	}

}

export { ClearPass };
