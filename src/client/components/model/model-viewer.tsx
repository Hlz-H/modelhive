import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

interface ModelViewerProps {
	gltfUrl: string;
	className?: string;
}

export function ModelViewer({ gltfUrl, className = "" }: ModelViewerProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!canvasRef.current || !gltfUrl) return;

		const canvas = canvasRef.current;
		const parent = canvas.parentElement;
		const width = parent?.clientWidth || 600;
		const height = parent?.clientHeight || 400;

		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0xf5f5f5);

		const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
		camera.position.set(2, 2, 4);

		const renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true,
			alpha: true,
		});
		renderer.setSize(width, height);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1;

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;
		controls.autoRotate = true;
		controls.autoRotateSpeed = 2;
		controls.target.set(0, 0, 0);
		controls.update();

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
		directionalLight.position.set(5, 10, 7);
		scene.add(directionalLight);

		const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
		fillLight.position.set(-5, 0, 5);
		scene.add(fillLight);

		const loader = new GLTFLoader();
		setLoading(true);
		setError("");

		loader.load(
			gltfUrl,
			(gltf) => {
				const model = gltf.scene;
				const box = new THREE.Box3().setFromObject(model);
				const center = box.getCenter(new THREE.Vector3());
				const size = box.getSize(new THREE.Vector3());
				const maxDim = Math.max(size.x, size.y, size.z);
				const scale = maxDim > 0 ? 2 / maxDim : 1;
				model.position.sub(center.clone().multiplyScalar(scale));
				model.scale.setScalar(scale);
				scene.add(model);
				setLoading(false);
			},
			undefined,
			(err) => {
				const msg = err instanceof Error ? err.message : "Failed to load model";
				setError(msg);
				setLoading(false);
			},
		);

		let animId: number;
		const animate = () => {
			animId = requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		};
		animate();

		const handleResize = () => {
			if (!canvas.parentElement) return;
			const w = canvas.parentElement.clientWidth;
			const h = canvas.parentElement.clientHeight;
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			renderer.setSize(w, h);
		};
		window.addEventListener("resize", handleResize);

		return () => {
			cancelAnimationFrame(animId);
			window.removeEventListener("resize", handleResize);
			renderer.dispose();
			scene.clear();
		};
	}, [gltfUrl]);

	return (
		<div className={`relative ${className}`}>
			<canvas ref={canvasRef} className="h-full w-full" />
			{loading && (
				<div className="absolute inset-0 flex items-center justify-center bg-gray-100">
					<p className="text-gray-500 text-sm">Loading 3D model...</p>
				</div>
			)}
			{error && (
				<div className="absolute inset-0 flex items-center justify-center bg-gray-100">
					<p className="text-red-500 text-sm">{error}</p>
				</div>
			)}
		</div>
	);
}
