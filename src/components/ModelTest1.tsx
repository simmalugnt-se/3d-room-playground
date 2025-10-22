import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useEffect, useRef } from "react";
import { Group, Vector3 } from "three";

interface ModelTest1Props {
  position?: Vector3;
  scale?: number;
  enableIdleAnimation?: boolean;
}

const ModelTest1: React.FC<ModelTest1Props> = ({
  position = new Vector3(0, 0, 0),
  scale = 1,
  enableIdleAnimation = true,
}) => {
  const groupRef = useRef<Group>(null);

  // Load GLTF model
  const { scene, animations } = useGLTF("/models/stacy_lightweight.glb");
  const { actions, mixer } = useAnimations(animations, groupRef);

  // Animation control
  useEffect(() => {
    if (actions) {
      console.log("Available animations:", Object.keys(actions));

      // Stop all animations first
      Object.values(actions).forEach((action) => action?.stop());

      if (enableIdleAnimation) {
        // Try to find and play a more obvious animation for testing
        const idleAction =
          actions["jump"] ||
          actions["wave"] ||
          actions["pockets"] ||
          actions["idle"];

        if (idleAction) {
          console.log("Playing idle animation from model");
          console.log("Animation duration:", idleAction.getClip().duration);
          console.log("Animation is playing:", idleAction.isRunning());
          idleAction.reset().setLoop(2, Infinity).play(); // Loop infinitely

          // Check if animation is actually playing after a short delay
          setTimeout(() => {
            console.log(
              "Animation is playing after delay:",
              idleAction.isRunning()
            );
            console.log("Animation time:", idleAction.time);
          }, 100);
        } else {
          console.log("No idle animation found in model");
        }
      }
    }
  }, [actions, enableIdleAnimation]);

  // Update animation mixer
  useFrame((state, delta) => {
    // Update the animation mixer to ensure animations play
    if (mixer) {
      mixer.update(delta);
    }
  });

  // Set initial position and scale
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(position);
      groupRef.current.scale.setScalar(scale);
    }
  }, [position, scale]);

  return (
    <group>
      <primitive
        ref={groupRef}
        object={scene.clone()}
        castShadow
        receiveShadow
      />
    </group>
  );
};

// Preload the model
useGLTF.preload("/models/stacy_lightweight.glb");

export default ModelTest1;
