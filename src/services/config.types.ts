export interface Config {
    lectures: { name: string; id: number }[];
    lecturers: string[];
    groups: { type: string; set: string[] }[];
    rooms: string[];
    dateOfFirstLecture: string;
}
