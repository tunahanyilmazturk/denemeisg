import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Company, Personnel, Incident, Training, PPE, Risk, Sector, JobDefinition, EquipmentDefinition, LocationDefinition, IncidentReasonDefinition } from '../types';
import { mockSectors, mockJobDefinitions, mockEquipmentDefinitions, mockLocationDefinitions, mockIncidentReasonDefinitions } from './mockData';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'tr' | 'en';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  incidentAlerts: boolean;
  trainingReminders: boolean;
  ppeExpiryAlerts: boolean;
  riskUpdates: boolean;
  dailySummary: boolean;
}

export interface SystemSettings {
  companyName: string;
  systemName: string;
  contactEmail: string;
  theme: Theme;
  language: Language;
  autoBackup: boolean;
  dateFormat: string;
}

interface AppState {
  companies: Company[];
  personnel: Personnel[];
  incidents: Incident[];
  trainings: Training[];
  ppes: PPE[];
  risks: Risk[];
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  // Settings
  systemSettings: SystemSettings;
  notificationSettings: NotificationSettings;
  userProfile: UserProfile;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  // ...existing actions
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
  // Advanced Definitions
  sectors: Sector[];
  jobDefinitions: JobDefinition[];
  equipmentDefinitions: EquipmentDefinition[];
  locationDefinitions: LocationDefinition[];
  incidentReasonDefinitions: IncidentReasonDefinition[];
  // Sector CRUD
  addSector: (sector: Sector) => void;
  updateSector: (sector: Sector) => void;
  deleteSector: (id: string) => void;
  // JobDefinition CRUD
  addJobDefinition: (job: JobDefinition) => void;
  updateJobDefinition: (job: JobDefinition) => void;
  deleteJobDefinition: (id: string) => void;
  getJobsBySector: (sectorId: string) => JobDefinition[];
  // EquipmentDefinition CRUD
  addEquipmentDefinition: (equipment: EquipmentDefinition) => void;
  updateEquipmentDefinition: (equipment: EquipmentDefinition) => void;
  deleteEquipmentDefinition: (id: string) => void;
  getEquipmentBySector: (sectorId: string) => EquipmentDefinition[];
  // LocationDefinition CRUD
  addLocationDefinition: (location: LocationDefinition) => void;
  updateLocationDefinition: (location: LocationDefinition) => void;
  deleteLocationDefinition: (id: string) => void;
  getLocationsByCompany: (companyId: string) => LocationDefinition[];
  getGlobalLocations: () => LocationDefinition[];
  // IncidentReasonDefinition CRUD
  addIncidentReasonDefinition: (reason: IncidentReasonDefinition) => void;
  updateIncidentReasonDefinition: (reason: IncidentReasonDefinition) => void;
  deleteIncidentReasonDefinition: (id: string) => void;
  getReasonsBySector: (sectorId: string) => IncidentReasonDefinition[];
  getAllReasons: () => IncidentReasonDefinition[];
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
    locations: ['A Blok', 'B Blok', 'Şantiye Alanı'],
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
    locations: ['Soğuk Hava Deposu', 'Yükleme Rampası', 'Ofis'],
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
    (set, get) => ({
      companies: mockCompanies,
      personnel: mockPersonnel,
      incidents: mockIncidents,
      trainings: mockTrainings,
      ppes: [],
      risks: [],
      // Advanced Definitions
      sectors: mockSectors,
      jobDefinitions: mockJobDefinitions,
      equipmentDefinitions: mockEquipmentDefinitions,
      locationDefinitions: mockLocationDefinitions,
      incidentReasonDefinitions: mockIncidentReasonDefinitions,
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
      // Settings
      systemSettings: {
        companyName: 'HanTech Teknoloji A.Ş.',
        systemName: 'HanTech AI',
        contactEmail: 'info@hantech.com',
        theme: 'system',
        language: 'tr',
        autoBackup: true,
        dateFormat: 'DD.MM.YYYY',
      },
      notificationSettings: {
        emailNotifications: true,
        incidentAlerts: true,
        trainingReminders: true,
        ppeExpiryAlerts: true,
        riskUpdates: true,
        dailySummary: false,
      },
      userProfile: {
        name: 'Yönetici',
        email: 'admin@hantech.com',
        phone: '0532 123 45 67',
        role: 'İSG Yöneticisi',
      },
      updateSystemSettings: (settings) => set((state) => {
        const newSettings = { ...state.systemSettings, ...settings };
        // Apply theme change immediately
        if (settings.theme) {
          if (settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else if (settings.theme === 'light') {
            document.documentElement.classList.remove('dark');
          } else {
            // System preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
        }
        return { systemSettings: newSettings };
      }),
      updateNotificationSettings: (settings) => set((state) => ({
        notificationSettings: { ...state.notificationSettings, ...settings },
      })),
      updateUserProfile: (profile) => set((state) => ({
        userProfile: { ...state.userProfile, ...profile },
      })),
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
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
      // Sector CRUD
      addSector: (sector) => set((state) => ({ sectors: [...state.sectors, sector] })),
      updateSector: (sector) => set((state) => ({
        sectors: state.sectors.map((s) => (s.id === sector.id ? sector : s)),
      })),
      deleteSector: (id) => set((state) => ({
        sectors: state.sectors.filter((s) => s.id !== id),
      })),
      // JobDefinition CRUD
      addJobDefinition: (job) => set((state) => ({ jobDefinitions: [...state.jobDefinitions, job] })),
      updateJobDefinition: (job) => set((state) => ({
        jobDefinitions: state.jobDefinitions.map((j) => (j.id === job.id ? job : j)),
      })),
      deleteJobDefinition: (id) => set((state) => ({
        jobDefinitions: state.jobDefinitions.filter((j) => j.id !== id),
      })),
      getJobsBySector: (sectorId) => get().jobDefinitions.filter((j) => j.sectorId === sectorId),
      // EquipmentDefinition CRUD
      addEquipmentDefinition: (equipment) => set((state) => ({ equipmentDefinitions: [...state.equipmentDefinitions, equipment] })),
      updateEquipmentDefinition: (equipment) => set((state) => ({
        equipmentDefinitions: state.equipmentDefinitions.map((e) => (e.id === equipment.id ? equipment : e)),
      })),
      deleteEquipmentDefinition: (id) => set((state) => ({
        equipmentDefinitions: state.equipmentDefinitions.filter((e) => e.id !== id),
      })),
      getEquipmentBySector: (sectorId) => get().equipmentDefinitions.filter((e) => e.sectorId === sectorId),
      // LocationDefinition CRUD
      addLocationDefinition: (location) => set((state) => ({ locationDefinitions: [...state.locationDefinitions, location] })),
      updateLocationDefinition: (location) => set((state) => ({
        locationDefinitions: state.locationDefinitions.map((l) => (l.id === location.id ? location : l)),
      })),
      deleteLocationDefinition: (id) => set((state) => ({
        locationDefinitions: state.locationDefinitions.filter((l) => l.id !== id),
      })),
      getLocationsByCompany: (companyId) => get().locationDefinitions.filter((l) => l.companyId === companyId),
      getGlobalLocations: () => get().locationDefinitions.filter((l) => !l.companyId),
      // IncidentReasonDefinition CRUD
      addIncidentReasonDefinition: (reason) => set((state) => ({ incidentReasonDefinitions: [...state.incidentReasonDefinitions, reason] })),
      updateIncidentReasonDefinition: (reason) => set((state) => ({
        incidentReasonDefinitions: state.incidentReasonDefinitions.map((r) => (r.id === reason.id ? reason : r)),
      })),
      deleteIncidentReasonDefinition: (id) => set((state) => ({
        incidentReasonDefinitions: state.incidentReasonDefinitions.filter((r) => r.id !== id),
      })),
      getReasonsBySector: (sectorId) => get().incidentReasonDefinitions.filter((r) => r.sectorId === sectorId || !r.sectorId),
      getAllReasons: () => get().incidentReasonDefinitions,
    }),
    {
      name: 'hantech-storage-v4',
      partialize: (state) => ({
        companies: state.companies,
        personnel: state.personnel,
        incidents: state.incidents,
        trainings: state.trainings,
        ppes: state.ppes,
        risks: state.risks,
        isDarkMode: state.isDarkMode,
        systemSettings: state.systemSettings,
        notificationSettings: state.notificationSettings,
        userProfile: state.userProfile,
        sidebarCollapsed: state.sidebarCollapsed,
        sectors: state.sectors,
        jobDefinitions: state.jobDefinitions,
        equipmentDefinitions: state.equipmentDefinitions,
        locationDefinitions: state.locationDefinitions,
        incidentReasonDefinitions: state.incidentReasonDefinitions,
      }),
    }
  )
);
