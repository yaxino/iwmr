import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from "rollup-plugin-terser";
import pkg from './package.json';

export default [
	// browser-friendly UMD build
	{
		input: 'src/index.js',
		
		output: [
			{
				name: 'IWMR',
				file:  `dist/${pkg.browser}.js`,
				format: 'umd'
			},
			{
				name: 'IWMR',
				file: `dist/${pkg.browser}.min.js`,
				format: 'umd',
				plugins: [terser({
					output: { comments: '/Version/' }
				})]
			}
		],
		plugins: [
			resolve(), // so Rollup can find `ms`
			commonjs() // so Rollup can convert `ms` to an ES module
		]
	}

];
