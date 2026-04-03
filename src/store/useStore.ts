import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Company, Personnel, Incident, Training, PPE, Risk } from '../types';

interface AppState {
  companies: Company[];
  personnel: Personnel[];
  incidents: Incident[];
  trainings: Training[];
  ppes: PPE[];
  risks: Risk[];
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  addCompany: (company: Company) => void;
  updateCompany: (company: Company) => void;
  deleteCompany: (id: string) => void;
  addPersonnel: (person: Personnel) => void;
  updatePersonnel: (person: Personnel) => void;
  deletePersonnel: (id: string) => void;
  addIncident: (incident: Incident) => void;
  updateIncident: (incident: Incident) => void;
  deleteIncident: (id: string) => void;
  addTraining: (training: Training) => void;
  updateTraining: (training: Training) => void;
  deleteTraining: (id: string) => void;
  addPPE: (ppe: PPE) => void;
  updatePPE: (ppe: PPE) => void;
  deletePPE: (id: string) => void;
  addRisk: (risk: Risk) => void;
  updateRisk: (risk: Risk) => void;
  deleteRisk: (id: string) => void;
}

const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'TechInşaat A.Ş.',
    sector: 'İnşaat',
    contactPerson: 'Ahmet Yılmaz',
    phone: '0532 123 45 67',
    email: 'ahmet@techinsaat.com',
    address: 'Maslak, İstanbul',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Mega Lojistik',
    sector: 'Lojistik',
    contactPerson: 'Ayşe Demir',
    phone: '0533 987 65 43',
    email: 'ayse@megalojistik.com',
    address: 'Gebze, Kocaeli',
    createdAt: new Date().toISOString(),
  },
];

const mockPersonnel: Personnel[] = [
  {
    id: '1',
    firstName: 'Mehmet',
    lastName: 'Kaya',
    tcNo: '12345678901',
    role: 'İSG Uzmanı',
    assignedCompanyId: '1',
    phone: '0555 111 22 33',
    email: 'mehmet.kaya@hantech.com',
    startDate: '2023-01-15',
  },
  {
    id: '2',
    firstName: 'Zeynep',
    lastName: 'Çelik',
    tcNo: '98765432109',
    role: 'İşyeri Hekimi',
    assignedCompanyId: '2',
    phone: '0544 444 55 66',
    email: 'zeynep.celik@hantech.com',
    startDate: '2023-03-01',
  },
];

const mockIncidents: Incident[] = [
  {
    id: '1',
    title: 'İskeleden Düşme Tehlikesi',
    description: 'B blok 3. katta iskele korkuluğunun gevşemesi sonucu ramak kala olayı yaşandı.',
    date: '2023-10-25T10:30:00',
    companyId: '1',
    personnelId: '1',
    severity: 'Yüksek',
    status: 'İnceleniyor',
    location: 'B Blok, 3. Kat',
    createdAt: new Date().toISOString(),
  },
];

const mockTrainings: Training[] = [
  {
    id: '1',
    title: 'Temel İş Sağlığı ve Güvenliği Eğitimi',
    trainer: 'Mehmet Kaya',
    date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
    duration: 8,
    participants: ['1', '2'],
    status: 'Planlandı',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Yüksekte Çalışma Eğitimi',
    trainer: 'Ahmet Yılmaz',
    date: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    duration: 4,
    participants: ['1'],
    status: 'Tamamlandı',
    createdAt: new Date().toISOString(),
  }
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      companies: mockCompanies,
      personnel: mockPersonnel,
      incidents: mockIncidents,
      trainings: mockTrainings,
      ppes: [],
      risks: [],
      isDarkMode: false,
      toggleDarkMode: () => set((state) => {
        const newMode = !state.isDarkMode;
        if (newMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { isDarkMode: newMode };
      }),
      addCompany: (company) => set((state) => ({ companies: [...state.companies, company] })),
      updateCompany: (company) => set((state) => ({
        companies: state.companies.map((c) => (c.id === company.id ? company : c)),
      })),
      deleteCompany: (id) => set((state) => ({
        companies: state.companies.filter((c) => c.id !== id),
      })),
      addPersonnel: (person) => set((state) => ({ personnel: [...state.personnel, person] })),
      updatePersonnel: (person) => set((state) => ({
        personnel: state.personnel.map((p) => (p.id === person.id ? person : p)),
      })),
      deletePersonnel: (id) => set((state) => ({
        personnel: state.personnel.filter((p) => p.id !== id),
      })),
      addIncident: (incident) => set((state) => ({ incidents: [...state.incidents, incident] })),
      updateIncident: (incident) => set((state) => ({
        incidents: state.incidents.map((i) => (i.id === incident.id ? incident : i)),
      })),
      deleteIncident: (id) => set((state) => ({
        incidents: state.incidents.filter((i) => i.id !== id),
      })),
      addTraining: (training) => set((state) => ({ trainings: [...state.trainings, training] })),
      updateTraining: (training) => set((state) => ({
        trainings: state.trainings.map((t) => (t.id === training.id ? training : t)),
      })),
      deleteTraining: (id) => set((state) => ({
        trainings: state.trainings.filter((t) => t.id !== id),
      })),
      addPPE: (ppe) => set((state) => ({ ppes: [...state.ppes, ppe] })),
      updatePPE: (ppe) => set((state) => ({
        ppes: state.ppes.map((p) => (p.id === ppe.id ? ppe : p)),
      })),
      deletePPE: (id) => set((state) => ({
        ppes: state.ppes.filter((p) => p.id !== id),
      })),
      addRisk: (risk) => set((state) => ({ risks: [...state.risks, risk] })),
      updateRisk: (risk) => set((state) => ({
        risks: state.risks.map((r) => (r.id === risk.id ? risk : r)),
      })),
      deleteRisk: (id) => set((state) => ({
        risks: state.risks.filter((r) => r.id !== id),
      })),
    }),
    {
      name: 'hantech-storage',
    }
  )
);
