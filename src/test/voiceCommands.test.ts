// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { parseVoiceCommand, describeVoiceCommand, type VoiceCommand } from '@/lib/voiceCommands';

describe('parseVoiceCommand — accensione', () => {
  it('accendi la tv', () => {
    expect(parseVoiceCommand('accendi la tv')).toEqual({ kind: 'power', target: 'tv', want: 'on' });
  });
  it('con wake word iniziale', () => {
    expect(parseVoiceCommand('ehi nova accendi la tv')).toEqual({ kind: 'power', target: 'tv', want: 'on' });
  });
  it('con wake word, maiuscole e punteggiatura', () => {
    expect(parseVoiceCommand('Ehi Nova, spegni la TV!')).toEqual({ kind: 'power', target: 'tv', want: 'off' });
  });
  it('spegni la televisione', () => {
    expect(parseVoiceCommand('spegni la televisione')).toEqual({ kind: 'power', target: 'tv', want: 'off' });
  });
  it('accendi il televisore', () => {
    expect(parseVoiceCommand('accendi il televisore')).toEqual({ kind: 'power', target: 'tv', want: 'on' });
  });
  it('accendi il chromecast non è rappresentabile (power solo tv)', () => {
    expect(parseVoiceCommand('accendi il chromecast')).toBeNull();
  });
  it('accendi la luce non è un comando tv', () => {
    expect(parseVoiceCommand('accendi la luce')).toBeNull();
  });
});

describe('parseVoiceCommand — volume e muto', () => {
  it('alza il volume', () => {
    expect(parseVoiceCommand('alza il volume')).toEqual({ kind: 'volume_up', target: 'tv' });
  });
  it('abbassa il volume della tv', () => {
    expect(parseVoiceCommand('abbassa il volume della tv')).toEqual({ kind: 'volume_down', target: 'tv' });
  });
  it('alza il volume del chromecast', () => {
    expect(parseVoiceCommand('alza il volume del chromecast')).toEqual({ kind: 'volume_up', target: 'chromecast' });
  });
  it('alza il volume di camera → chromecast', () => {
    expect(parseVoiceCommand('alza il volume di camera')).toEqual({ kind: 'volume_up', target: 'chromecast' });
  });
  it('volume su', () => {
    expect(parseVoiceCommand('volume su')).toEqual({ kind: 'volume_up', target: 'tv' });
  });
  it('volume giù', () => {
    expect(parseVoiceCommand('volume giù')).toEqual({ kind: 'volume_down', target: 'tv' });
  });
  it('aumenta il volume', () => {
    expect(parseVoiceCommand('aumenta il volume')).toEqual({ kind: 'volume_up', target: 'tv' });
  });
  it('muto', () => {
    expect(parseVoiceCommand('muto')).toEqual({ kind: 'mute', target: 'tv' });
  });
  it('silenzia la tv', () => {
    expect(parseVoiceCommand('silenzia la tv')).toEqual({ kind: 'mute', target: 'tv' });
  });
  it('metti muto', () => {
    expect(parseVoiceCommand('metti muto')).toEqual({ kind: 'mute', target: 'tv' });
  });
  it('togli il muto è unmute, non supportato', () => {
    expect(parseVoiceCommand('togli il muto')).toBeNull();
  });
});

describe('parseVoiceCommand — canali', () => {
  it('canale successivo', () => {
    expect(parseVoiceCommand('canale successivo')).toEqual({ kind: 'channel_up', target: 'tv' });
  });
  it('canale precedente', () => {
    expect(parseVoiceCommand('canale precedente')).toEqual({ kind: 'channel_down', target: 'tv' });
  });
  it('canale su', () => {
    expect(parseVoiceCommand('canale su')).toEqual({ kind: 'channel_up', target: 'tv' });
  });
  it('canale giù', () => {
    expect(parseVoiceCommand('canale giù')).toEqual({ kind: 'channel_down', target: 'tv' });
  });
  it('cambia canale', () => {
    expect(parseVoiceCommand('cambia canale')).toEqual({ kind: 'channel_up', target: 'tv' });
  });
});

describe('parseVoiceCommand — play / pausa', () => {
  it('metti in pausa', () => {
    expect(parseVoiceCommand('metti in pausa')).toEqual({ kind: 'pause', target: 'tv' });
  });
  it('pausa', () => {
    expect(parseVoiceCommand('pausa')).toEqual({ kind: 'pause', target: 'tv' });
  });
  it('metti in pausa il chromecast', () => {
    expect(parseVoiceCommand('metti in pausa il chromecast')).toEqual({ kind: 'pause', target: 'chromecast' });
  });
  it('riprendi', () => {
    expect(parseVoiceCommand('riprendi')).toEqual({ kind: 'play', target: 'tv' });
  });
  it('riprendi la riproduzione', () => {
    expect(parseVoiceCommand('riprendi la riproduzione')).toEqual({ kind: 'play', target: 'tv' });
  });
  it('play', () => {
    expect(parseVoiceCommand('play')).toEqual({ kind: 'play', target: 'tv' });
  });
});

describe('parseVoiceCommand — app', () => {
  it('apri youtube', () => {
    expect(parseVoiceCommand('apri youtube')).toEqual({ kind: 'launch_app', target: 'tv', app: 'youtube' });
  });
  it('apri youtube sulla tv', () => {
    expect(parseVoiceCommand('apri youtube sulla tv')).toEqual({ kind: 'launch_app', target: 'tv', app: 'youtube' });
  });
  it('metti netflix sul chromecast', () => {
    expect(parseVoiceCommand('metti netflix sul chromecast')).toEqual({ kind: 'launch_app', target: 'chromecast', app: 'netflix' });
  });
  it('apri spotify in camera', () => {
    expect(parseVoiceCommand('apri spotify in camera')).toEqual({ kind: 'launch_app', target: 'chromecast', app: 'spotify' });
  });
  it('apri youtube su camera', () => {
    expect(parseVoiceCommand('apri youtube su camera')).toEqual({ kind: 'launch_app', target: 'chromecast', app: 'youtube' });
  });
  it('ehi nova metti spotify', () => {
    expect(parseVoiceCommand('ehi nova metti spotify')).toEqual({ kind: 'launch_app', target: 'tv', app: 'spotify' });
  });
});

describe('parseVoiceCommand — sorgente', () => {
  it('sorgente tv', () => {
    expect(parseVoiceCommand('sorgente tv')).toEqual({ kind: 'source', target: 'tv', source: 'tv' });
  });
  it('metti hdmi 1', () => {
    expect(parseVoiceCommand('metti hdmi 1')).toEqual({ kind: 'source', target: 'tv', source: 'HDMI1' });
  });
  it('passa a hdmi 2', () => {
    expect(parseVoiceCommand('passa a hdmi 2')).toEqual({ kind: 'source', target: 'tv', source: 'HDMI2' });
  });
  it('sorgente hdmi 1', () => {
    expect(parseVoiceCommand('sorgente hdmi 1')).toEqual({ kind: 'source', target: 'tv', source: 'HDMI1' });
  });
});

describe('parseVoiceCommand — frasi non-comando', () => {
  it.each([
    'che ore sono',
    'ricorda che devo comprare il latte',
    'ricordami di spegnere la tv',
    'ciao',
    "com'è il meteo",
    'aggiungi latte alla spesa',
    'che tempo fa domani',
    '',
    '   ',
    'grazie',
  ])('null per %s', (text) => {
    expect(parseVoiceCommand(text)).toBeNull();
  });
});

describe('describeVoiceCommand', () => {
  it.each<[VoiceCommand, string]>([
    [{ kind: 'power', target: 'tv', want: 'on' }, 'Accendere la TV'],
    [{ kind: 'power', target: 'tv', want: 'off' }, 'Spegnere la TV'],
    [{ kind: 'volume_up', target: 'tv' }, 'Alzare il volume della TV'],
    [{ kind: 'volume_down', target: 'chromecast' }, 'Abbassare il volume del Chromecast'],
    [{ kind: 'mute', target: 'tv' }, 'Silenziare la TV'],
    [{ kind: 'mute', target: 'chromecast' }, 'Silenziare il Chromecast'],
    [{ kind: 'channel_up', target: 'tv' }, 'Canale successivo sulla TV'],
    [{ kind: 'channel_down', target: 'tv' }, 'Canale precedente sulla TV'],
    [{ kind: 'play', target: 'tv' }, 'Riprendere la riproduzione sulla TV'],
    [{ kind: 'pause', target: 'chromecast' }, 'Mettere in pausa sul Chromecast'],
    [{ kind: 'launch_app', target: 'tv', app: 'youtube' }, 'Aprire YouTube sulla TV'],
    [{ kind: 'launch_app', target: 'chromecast', app: 'netflix' }, 'Aprire Netflix sul Chromecast'],
    [{ kind: 'launch_app', target: 'tv', app: 'spotify' }, 'Aprire Spotify sulla TV'],
    [{ kind: 'source', target: 'tv', source: 'tv' }, 'Passare alla sorgente TV'],
    [{ kind: 'source', target: 'tv', source: 'HDMI1' }, 'Passare a HDMI1'],
    [{ kind: 'source', target: 'tv', source: 'HDMI2' }, 'Passare a HDMI2'],
  ])('describe %j → %s', (cmd, expected) => {
    expect(describeVoiceCommand(cmd)).toBe(expected);
  });

  it('describe è coerente con parse (round-trip)', () => {
    expect(describeVoiceCommand(parseVoiceCommand('ehi nova accendi la tv')!)).toBe('Accendere la TV');
    expect(describeVoiceCommand(parseVoiceCommand('apri youtube su camera')!)).toBe('Aprire YouTube sul Chromecast');
    expect(describeVoiceCommand(parseVoiceCommand('metti hdmi 2')!)).toBe('Passare a HDMI2');
  });
});
