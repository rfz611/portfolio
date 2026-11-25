import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';
import { ROOM, GARAGE } from '../config/layout';
import { Interactive } from '../objects/Interactive';
import { useScene } from '../store/useScene';
import { makeCanvas, retile, tex } from '../textures/canvas';
import { paintAd, paintNoirWindows, paintRoad, type AdWords } from '../textures/city';
import { hdr, lib } from '../textures/library';
import { CENTER_X, FACADE_UV, GROUND_Y } from './cityLayout';
import { box, merge } from './geo';
import { ADS, CAR_GAP, cityGeometryNow, type Ad } from './cityGeometry';

/** Holofotes que varrem o céu bem devagar, ao fundo (como nos desenhos noir antigos). */
const SEARCHLIGHTS: [number, number, number][] = [
  [CENTER_X - 320, -820, 0.0],
  [CENTER_X + 380, -700, 2.1],
];

function AdBoard({ ad }: { ad: Ad }) {
  const { mat } = lib();
  const { t } = useTranslation();
  // pela janela (de pé na frente do vidro), os anúncios dos projetos levam à TV
  const looking = useScene((s) => s.view === 'janela');
  const words: AdWords = useMemo(
    () => ({
      tag: ad.kind === 'unicar' || ad.kind === 'frotas' ? t(`city.${ad.kind}Tag`) : undefined,
      cta: ad.channel !== undefined ? `${t('city.channel')} 0${ad.channel + 1}` : undefined,
      tonight: t('city.tonight'),
    }),
    [t, ad.kind, ad.channel],
  );
  const [w, h] = ad.size;
  const face = useMemo(() => {
    const vertical = h > w;
    const map = tex(
      makeCanvas(vertical ? 160 : 1024, vertical ? 832 : Math.round((1024 * h) / w), (c, cw, ch) =>
        paintAd(c, cw, ch, ad.kind, words),
      ),
      { clamp: true, aniso: 8 },
    );
    return new THREE.MeshBasicMaterial({ map, color: hdr('#ffffff', 1.05), toneMapped: false });
  }, [ad.kind, w, h, words]);
  const geo = useMemo(
    () => ({
      frame: merge([
        box([w + 1, 0.8, 0.8], [0, h / 2 + 0.4, -0.4]),
        box([w + 1, 0.8, 0.8], [0, -h / 2 - 0.4, -0.4]),
        box([0.8, h + 1.6, 0.8], [-w / 2 - 0.5, 0, -0.4]),
        box([0.8, h + 1.6, 0.8], [w / 2 + 0.5, 0, -0.4]),
      ]),
      // prédio onde o anúncio está pendurado
      building: box([w + 14, h + 120, 26], [0, -(h + 120) / 2 + h / 2 + 8, -14], {
        uv: FACADE_UV,
      }),
    }),
    [w, h],
  );
  // o prédio do anúncio tem janelas como os outros (não é um bloco preto)
  const facade = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex(
          makeCanvas(256, 256, (c, cw, ch) =>
            paintNoirWindows(c, cw, ch, 300 + ad.kind.length * 7, 0.22),
          ),
          { aniso: 8 },
        ),
        color: '#8e8890',
      }),
    [ad.kind],
  );
  return (
    <group position={ad.at} rotation={[0, ad.yaw, 0]}>
      {!ad.bare && <mesh geometry={geo.building} material={facade} />}
      <mesh geometry={geo.frame} material={mat.darkMetal} />
      {ad.channel !== undefined ? (
        <Interactive
          id={`ad-${ad.kind}`}
          label={`objects.ad.${ad.kind}`}
          enabled={looking}
          outline={false}
          onClick={() => {
            const state = useScene.getState();
            state.setTvChannel(ad.channel ?? 0);
            state.setView('tv');
          }}
        >
          <mesh position={[0, 0, 0.05]} material={face}>
            <planeGeometry args={[w, h]} />
          </mesh>
        </Interactive>
      ) : (
        <mesh position={[0, 0, 0.05]} material={face}>
          <planeGeometry args={[w, h]} />
        </mesh>
      )}
    </group>
  );
}

/**
 * Neblina avermelhada da cidade, a partir de 200 m: não mexe na sala, apaga a
 * cidade ao longe. Entra junto com as luzes, antes de tudo: a neblina muda o
 * shader de todos os materiais, e ligá-la depois recompilaria a cena inteira.
 */
export function CityFog() {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    scene.fog = new THREE.Fog('#3a1216', 200, 1100);
    return () => {
      scene.fog = null;
    };
  }, [scene]);
  return null;
}

/**
 * A cidade lá fora, no clima dos desenhos noir antigos: silhuetas escuras
 * de prédios art déco com poucas janelas amarelas, céu preto com o
 * horizonte vermelho, neblina avermelhada, holofotes varrendo o céu,
 * carros andando nas avenidas e letreiros de neon inventados. As coberturas
 * com gente (Rooftops) e o Folks entram à parte, cada um na sua etapa.
 */
export function City() {
  const { mat, tex: t } = lib();
  const geo = useMemo(cityGeometryNow, []);

  const mats = useMemo(() => {
    const windows = (seed: number, lit: number) =>
      new THREE.MeshBasicMaterial({
        map: tex(
          makeCanvas(256, 256, (c, w, h) => paintNoirWindows(c, w, h, seed, lit)),
          {
            aniso: 8,
          },
        ),
        vertexColors: true,
      });
    return {
      blocks: [windows(211, 0.2), windows(223, 0.28), windows(227, 0.12)],
      // topo das torres marcantes iluminado por refletores (como os arranha-céus antigos)
      litTop: new THREE.MeshBasicMaterial({
        map: tex(makeCanvas(256, 256, (c, w, h) => paintNoirWindows(c, w, h, 229, 0.5))),
        color: hdr('#ffdcb0', 1.9),
        toneMapped: false,
      }),
      spire: new THREE.MeshBasicMaterial({ color: '#2a2630' }),
      road: (repeat: number) =>
        new THREE.MeshBasicMaterial({
          map: tex(makeCanvas(64, 200, paintRoad), { aniso: 8, repeat: [1, repeat] }),
          color: hdr('#ffffff', 1.5),
          // o chão e as ruas ficam a centímetros um do outro, a 95 m de
          // distância: sem gravar profundidade e desenhados em ordem, não piscam
          depthWrite: false,
        }),
      lamp: new THREE.MeshBasicMaterial({ color: hdr('#ffb062', 2.2), toneMapped: false }),
      roof: new THREE.MeshBasicMaterial({ color: '#171418' }),
      car: new THREE.MeshBasicMaterial({ color: hdr('#fff3dc', 2.4), toneMapped: false }),
      carBody: new THREE.MeshBasicMaterial({ color: '#16131a' }),
      carBeam: new THREE.MeshBasicMaterial({
        map: tex(
          makeCanvas(32, 64, (c, w, h) => {
            const g = c.createLinearGradient(0, h, 0, 0);
            g.addColorStop(0, 'rgba(255,240,210,0.55)');
            g.addColorStop(1, 'rgba(255,240,210,0)');
            c.fillStyle = g;
            c.beginPath();
            c.moveTo(w * 0.3, h);
            c.lineTo(w * 0.7, h);
            c.lineTo(w, 0);
            c.lineTo(0, 0);
            c.fill();
          }),
          { clamp: true },
        ),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      tail: new THREE.MeshBasicMaterial({ color: hdr('#ff2a1a', 2.2), toneMapped: false }),
      ground: new THREE.MeshBasicMaterial({ color: '#0b090c', depthWrite: false }),
      beam: new THREE.MeshBasicMaterial({
        color: '#ffe2c0',
        transparent: true,
        opacity: 0.07,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      }),
      sky: (() => {
        const m = mat.sky.clone();
        m.fog = false;
        return m;
      })(),
      facade: new THREE.MeshBasicMaterial({ map: retile(t.facade, 3, 10), color: '#4a4a55' }),
    };
  }, [mat, t]);

  const roadNS = useMemo(() => mats.road(geo.roadLength / 25), [mats, geo]);
  const roadEW = useMemo(() => mats.road(geo.roadWidthEW / 25), [mats, geo]);
  const beacon = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  const base = useRef(hdr('#ff2418', 3));
  const carsRef = useRef<THREE.Group>(null);
  const tailsRef = useRef<THREE.Group>(null);
  const beams = useRef<(THREE.Group | null)[]>([]);
  const beamGeo = useMemo(
    () => new THREE.CylinderGeometry(22, 1.2, 620, 18, 1, true).translate(0, 310, 0),
    [],
  );
  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const pulse = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(time * 2.1), 3);
    beacon.color.copy(base.current).multiplyScalar(pulse);
    // faróis vêm na direção do prédio; lanternas vão embora
    const drive = (time * 11) % CAR_GAP;
    if (carsRef.current) carsRef.current.position.z = drive;
    if (tailsRef.current) tailsRef.current.position.z = -drive;
    beams.current.forEach((beam, i) => {
      if (!beam) return;
      beam.rotation.y = SEARCHLIGHTS[i][2] + Math.sin(time * 0.12 + i * 2) * 0.7;
    });
  });

  return (
    <group name="city">
      <mesh material={mats.sky} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[860, 24, 16]} />
      </mesh>
      <mesh
        position={[CENTER_X, GROUND_Y, -600]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={mats.ground}
        renderOrder={-6}
      >
        <planeGeometry args={[3000, 3000]} />
      </mesh>
      {/* chão, depois as ruas leste-oeste e por cima as norte-sul (cruzamentos) */}
      <mesh geometry={geo.roadsEW} material={roadEW} renderOrder={-5} />
      <mesh geometry={geo.roadsNS} material={roadNS} renderOrder={-4} />
      <mesh geometry={geo.lamps} material={mats.lamp} />
      <group ref={carsRef}>
        <mesh geometry={geo.comingBody} material={mats.carBody} />
        <mesh geometry={geo.comingLights} material={mats.car} />
        <mesh geometry={geo.comingBeams} material={mats.carBeam} />
      </group>
      <group ref={tailsRef}>
        <mesh geometry={geo.goingBody} material={mats.carBody} />
        <mesh geometry={geo.goingLights} material={mats.tail} />
      </group>
      {SEARCHLIGHTS.map(([x, z], i) => (
        <group
          key={i}
          position={[x, GROUND_Y, z]}
          ref={(g) => {
            beams.current[i] = g;
          }}
        >
          <mesh geometry={beamGeo} material={mats.beam} rotation={[0, 0, 0.42]} />
        </group>
      ))}
      {geo.blocks.map((g, i) => (
        <mesh key={i} geometry={g} material={mats.blocks[i]} />
      ))}
      <mesh geometry={geo.litTops} material={mats.litTop} />
      <mesh geometry={geo.spires} material={mats.spire} />
      <mesh geometry={geo.roofs} material={mats.roof} />
      <mesh geometry={geo.beacons} material={beacon} />
      {ADS.map((ad) => (
        <AdBoard key={ad.kind} ad={ad} />
      ))}
      {/* o prédio abaixo da cobertura */}
      <mesh position={[CENTER_X, -33.1, ROOM.z1 + 0.02]} material={mats.facade}>
        <planeGeometry args={[GARAGE.x1 - ROOM.x0 + 0.2, 64]} />
      </mesh>
    </group>
  );
}
