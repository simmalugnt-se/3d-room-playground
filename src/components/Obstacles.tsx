import React from 'react';
import { OBSTACLE_DEFINITIONS } from './Room';

const Obstacles: React.FC = () => {

  return (
    <group>
      {OBSTACLE_DEFINITIONS.map((obstacle, index) => {
        const meshProps = {
          position: obstacle.position as [number, number, number],
          castShadow: true,
          receiveShadow: true,
        };

        const material = <meshLambertMaterial color={obstacle.color} />;

        switch (obstacle.type) {
          case 'box':
            return (
              <mesh key={index} {...meshProps}>
                <boxGeometry args={obstacle.size as [number, number, number]} />
                {material}
              </mesh>
            );
          case 'sphere':
            return (
              <mesh key={index} {...meshProps}>
                <sphereGeometry args={[obstacle.size[0] / 2]} />
                {material}
              </mesh>
            );
          case 'cylinder':
            return (
              <mesh key={index} {...meshProps}>
                <cylinderGeometry args={[obstacle.size[0] / 2, obstacle.size[0] / 2, obstacle.size[1]]} />
                {material}
              </mesh>
            );
          default:
            return null;
        }
      })}
    </group>
  );
};

export default Obstacles;