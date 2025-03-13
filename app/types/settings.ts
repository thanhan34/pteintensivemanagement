export interface Settings {
  accounting: {
    defaultFromDate: string;    
  };
  attendance: {
    defaultFromDate: string;
    defaultToDate: string;
  };
  students: {
    trainerOptions: string[];
    defaultFromDate: string;
    defaultToDate: string;
  };
}

export type SettingsKey = keyof Settings;
export type AccountingSettings = Settings['accounting'];
export type AttendanceSettings = Settings['attendance'];
export type StudentsSettings = Settings['students'];
