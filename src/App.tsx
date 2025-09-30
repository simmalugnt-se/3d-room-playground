import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SocketProvider } from './contexts/SocketContext';
import Room from './components/Room';
import './App.css';

function App() {
  return (
    <SocketProvider>
      <div className="App" style={{ width: '100vw', height: '100vh' }}>
        <Canvas
          orthographic
          camera={{ 
            position: [15, 15, 15], // Isometric angle positioning
            zoom: 35,
            near: 0.1,
            far: 1000
          }}
          shadows
        >
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          <Room />
          <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            minPolarAngle={Math.PI / 6} // Prevent camera from going too low
            maxPolarAngle={Math.PI / 2.5} // Prevent camera from going too high
            target={[0, 0, 0]} // Keep focused on center of room
          />
        </Canvas>
      </div>
    </SocketProvider>
  );
}

export default App;
