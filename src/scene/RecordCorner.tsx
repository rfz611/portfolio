import { ROOM } from '../config/layout';
import { Clock } from '../objects/Clock';
import { CrtTv } from '../objects/CrtTv';
import { Interactive } from '../objects/Interactive';
import { Lamp } from '../objects/Lamp';
import { LAMP_A, LAMP_B, RACK_POS, SHELF_POS, TURNTABLE_POS } from '../objects/recordLayout';
import { Records } from '../objects/Records';
import { RecordShelf } from '../objects/RecordShelf';
import { Turntable } from '../objects/Turntable';
import { TvRack } from '../objects/TvRack';
import { useScene } from '../store/useScene';
import { lib } from '../textures/library';
import { OptionalModel } from './OptionalModel';

/**
 * Cantinho dos discos, encostado na parede esquerda e de frente para o
 * sofá: estante com as capas, toca-discos, caixas de som, TV de tubo no
 * rack, relógio e dois abajures.
 */
export function RecordCorner() {
  const { mat } = lib();
  const home = useScene((s) => s.view === 'home');
  const setView = useScene((s) => s.setView);

  return (
    <group name="record-corner" position={[ROOM.x0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      <Interactive
        id="records"
        label="objects.records"
        enabled={home}
        onClick={() => setView('discos')}
      >
        <group position={SHELF_POS}>
          <OptionalModel file="record_shelf.glb">
            <RecordShelf />
          </OptionalModel>
        </group>
        <group position={TURNTABLE_POS}>
          <Turntable />
        </group>
        <Records />
      </Interactive>

      <Interactive id="tv" label="objects.tv" enabled={home} onClick={() => setView('tv')}>
        <group position={RACK_POS}>
          <OptionalModel file="tv_rack.glb">
            <TvRack />
          </OptionalModel>
          <group position={[-0.095, 0.45, 0]}>
            <CrtTv />
          </group>
        </group>
      </Interactive>
      <group position={[RACK_POS[0] + 0.35, 0.45, RACK_POS[2] + 0.12]}>
        <Clock />
      </group>

      <Lamp position={LAMP_A} />
      <Lamp position={LAMP_B} />

      {/* luz "assada" na parede atrás de cada abajur */}
      {[LAMP_A, LAMP_B].map((lamp) => (
        <mesh key={lamp[0]} position={[lamp[0], 1.22, 0.012]} material={mat.glowAmberSoft}>
          <planeGeometry args={[3.2, 2.9]} />
        </mesh>
      ))}
    </group>
  );
}
