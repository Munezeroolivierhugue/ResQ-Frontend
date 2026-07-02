const FIRST_NAMES = [
  'Amara', 'Claudette', 'Didier', 'Emmanuel', 'Françoise', 'Gilbert', 'Honorine',
  'Innocent', 'Jacqueline', 'Kevin', 'Leah', 'Marcel', 'Nadine', 'Olivier',
  'Patricia', 'Rodrigue', 'Solange', 'Thomas', 'Viviane', 'Wilson', 'Alphonse',
  'Beatrice', 'Celestin', 'Dieudonne', 'Esperance', 'Fabrice', 'Grace', 'Hermine',
  'Immaculee', 'Keza', 'Lisette', 'Modeste', 'Noella', 'Paul', 'Rose',
  'Samuel', 'Therese', 'Valentin', 'Yves', 'Zephyrin', 'Aime', 'Brigitte',
]

const LAST_NAMES = [
  'Uwimana', 'Niyonzima', 'Hakizimana', 'Munyemana', 'Nsanzimana', 'Bizimana',
  'Habimana', 'Kayitesi', 'Mukamana', 'Nzeyimana', 'Uwamariya', 'Ishimwe',
  'Uwabakuze', 'Ntirenganya', 'Nizeyimana', 'Munyaneza', 'Nyiraneza',
  'Nshimiyimana', 'Butera', 'Mugisha', 'Ndayambaje', 'Mukamurenzi', 'Tuyishime',
  'Gakwenzire', 'Rutagarama', 'Nkurunziza', 'Sebazungu', 'Hategekimana',
  'Uwizeye', 'Ndagijimana', 'Mutabazi', 'Nyirahabimana', 'Nkundimana',
]

export function generateCallerName() {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  const last  = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
  return `${first} ${last}`
}
