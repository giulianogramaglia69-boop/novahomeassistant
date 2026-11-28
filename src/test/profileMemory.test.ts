// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { parseRememberRequest, factToKey } from '@/lib/profileMemory';

describe('parseRememberRequest', () => {
  it('ricorda che ... salva il fatto con chiave derivata', () => {
    expect(parseRememberRequest('ricorda che sono allergico alle noci')).toEqual({
      key: 'allergico_alle_noci',
      value: 'sono allergico alle noci',
    });
  });

  it('ricordati che ... funziona come ricorda', () => {
    expect(parseRememberRequest('ricordati che la mia pizza preferita è la margherita')).toEqual({
      key: 'pizza_preferita_margherita',
      value: 'la mia pizza preferita è la margherita',
    });
  });

  it('memorizza che ... funziona', () => {
    expect(parseRememberRequest('memorizza che mi sveglio alle 7')).toEqual({
      key: 'sveglio_alle_7',
      value: 'mi sveglio alle 7',
    });
  });

  it('accetta anche senza "che"', () => {
    expect(parseRememberRequest('ricorda il mio compleanno è il 4 dicembre')).not.toBeNull();
  });

  it('toglie la punteggiatura finale dal valore', () => {
    expect(parseRememberRequest('ricorda che odio il lunedì.')).toEqual({
      key: 'odio_lunedì',
      value: 'odio il lunedì',
    });
  });

  it('ignora maiuscole e spazi extra', () => {
    expect(parseRememberRequest('  RICORDA CHE  ho due gatti  ')).toEqual({
      key: 'due_gatti',
      value: 'ho due gatti',
    });
  });

  it('rifiuta frasi troppo corte', () => {
    expect(parseRememberRequest('ricorda che ok')).toBeNull();
    expect(parseRememberRequest('ricorda che')).toBeNull();
  });

  it('rifiuta frasi che non sono richieste di memoria', () => {
    expect(parseRememberRequest('che ore sono?')).toBeNull();
    expect(parseRememberRequest('accendi la tv')).toBeNull();
    expect(parseRememberRequest('ricordami di comprare il latte')).toBeNull();
    expect(parseRememberRequest('ciao')).toBeNull();
  });
});

describe('factToKey', () => {
  it('toglie stopword e limita a 3 parole', () => {
    expect(factToKey('sono allergico alle noci e alle arachidi')).toBe('allergico_alle_noci');
  });

  it('cade su "nota" se restano solo stopword', () => {
    expect(factToKey('sono io')).toBe('nota');
  });
});
