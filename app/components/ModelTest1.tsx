"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ScrollControls,
  SoftShadows,
  useAnimations,
  useGLTF,
  useScroll,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, TiltShift2 } from "@react-three/postprocessing";
import { useEffect, useRef } from "react";

function Model(props: any) {
  const scroll = useScroll();
  const { nodes, materials, animations } = useGLTF(
    "/jump-transformed.glb"
  ) as any;
  const { ref, actions } = useAnimations(animations);
  const jumpActionRef = useRef<any>(null);

  useEffect(() => {
    if (actions && actions.jump) {
      // Store the action in ref to avoid modifying hook return value
      jumpActionRef.current = actions.jump;
      jumpActionRef.current.reset().play();
      jumpActionRef.current.paused = true;
    }
  }, [actions]);

  useFrame(() => {
    if (jumpActionRef.current) {
      jumpActionRef.current.time =
        jumpActionRef.current.getClip().duration * scroll.offset;
    }
  });
  return (
    <group {...props} ref={ref}>
      <primitive object={nodes.mixamorigHips} />
      <skinnedMesh
        castShadow
        receiveShadow
        geometry={nodes.Ch03.geometry}
        material={materials.Ch03_Body}
        skeleton={nodes.Ch03.skeleton}
      />
    </group>
  );
}

export default function ModelTest1() {
  return (
    <Canvas
      shadows
      gl={{ antialias: false }}
      camera={{ position: [1, 0.5, 2.5], fov: 50 }}
    >
      <color attach="background" args={["#f0f0f0"]} />
      <fog attach="fog" args={["#f0f0f0", 0, 20]} />
      <ambientLight intensity={0.5} />
      <directionalLight
        intensity={2}
        position={[-5, 5, 5]}
        castShadow
        shadow-mapSize={2048}
        shadow-bias={-0.0001}
      />
      <ScrollControls damping={0.2} maxSpeed={0.5} pages={2}>
        <Model
          position={[0, -1, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={0.01}
        />
      </ScrollControls>
      <mesh
        rotation={[-0.5 * Math.PI, 0, 0]}
        position={[0, -1.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 10, 1, 1]} />
        <shadowMaterial transparent opacity={0.75} />
      </mesh>
      <SoftShadows size={40} samples={16} />
      <EffectComposer multisampling={4}>
        <TiltShift2 blur={1} />
      </EffectComposer>
    </Canvas>
  );
}
