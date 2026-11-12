import { portfolioLine, rpgClass, type SkillClassInput } from '../rpgClass';

const piano: SkillClassInput = { slug: 'piano', classTitle: 'Bard', tierIndex: 3, lowerName: 'piano' };
const calisthenics: SkillClassInput = { slug: 'calisthenics', classTitle: 'Paladin', tierIndex: 2, lowerName: 'calisthenics' };
const pottery: SkillClassInput = { slug: 'pottery', classTitle: 'Earthshaper', tierIndex: 1, lowerName: 'pottery' };
const spanish: SkillClassInput = { slug: 'spanish', classTitle: 'Polyglot', tierIndex: 0, lowerName: 'spanish' };

describe('rpgClass', () => {
  it('joins class titles ordered by tier', () => {
    expect(rpgClass([calisthenics, piano])).toBe('Bard Paladin');
    expect(rpgClass([pottery, calisthenics, piano])).toBe('Bard Paladin Earthshaper');
  });

  it('breaks tier ties with the prototype CLASS_ORDER', () => {
    const guitar: SkillClassInput = { slug: 'guitar', classTitle: 'Minstrel', tierIndex: 1, lowerName: 'guitar' };
    // Same tier: guitar comes before pottery per CLASS_ORDER.
    expect(rpgClass([pottery, guitar])).toBe('Minstrel Earthshaper');
  });

  it('is just "Larper" with no skills', () => {
    expect(rpgClass([])).toBe('Larper');
  });
});

describe('portfolioLine', () => {
  it('renders "Legit in piano, Apprentice in pottery, Larping in Spanish"', () => {
    expect(portfolioLine([spanish, pottery, piano])).toBe(
      'Legit in piano, Apprentice in pottery, Larping in spanish',
    );
  });

  it('has an encouraging default', () => {
    expect(portfolioLine([])).toBe('Larping at everything');
  });
});
