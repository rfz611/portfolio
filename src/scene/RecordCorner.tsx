import { ROOM } from '../config/layout';
import { CrtTv } from '../objects/CrtTv';
import { Interactive } from '../objects/Interactive';
import { Lamp } from '../objects/Lamp';
import { MediaWall } from '../objects/MediaWall';
import { LAMP_A, LAMP_B, TURNTABLE_POS, TV_POS } from '../objects/recordLayout';
import { Records } from '../objects/Records';
import { Turntable } from '../objects/Turntable';
import { useScene } from '../store/useScene';
import { OptionalModel } from './OptionalModel';

/**
 * Cantinho dos discos na parede esquerda, de frente para o sofá: aparador
 * de mogno com a TV, o toca-discos e as caixas de som; as capas expostas
 * em duas prateleiras de galeria; um abajur em cada ponta.
 */
export function RecordCorner() {
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
        <OptionalModel file="record_shelf.glb">
          <MediaWall />
        </OptionalModel>
        <group position={TURNTABLE_POS}>
          <Turntable />
        </group>
        <Records />
      </Interactive>

      <Interactive id="tv" label="objects.tv" enabled={home} onClick={() => setView('tv')}>
        <group position={TV_POS}>
          <OptionalModel file="crt_tv.glb">
            <CrtTv />
          </OptionalModel>
        </group>
      </Interactive>

      <Lamp position={LAMP_A} />
      <Lamp position={LAMP_B} />
    </group>
  );
}
