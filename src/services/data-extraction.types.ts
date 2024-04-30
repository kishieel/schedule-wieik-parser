interface Xlsx {
    cell: string;
    value: string;
}

interface Lecture {
    id: number;
    title: string;
    lecturer: string;
    room: string;
    start: string;
    end: string;
    type: string;
    group: string;
    duration: number;
}

interface Lectures {
    date: string;
    classes: Lecture[];
}
