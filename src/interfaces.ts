export interface FrontMatter {
  lang: string;
  firstName: string;
  lastName: string;
  middleName: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: Date;
  placeOfBirth: string;
  citizenship: string;
  picture: string;
  github?: string;
  linkedin?: string;
  languageSkills: { [language: string]: number };
}

export interface CV extends FrontMatter {
  filename: string;
  fullName: string;
  experience: Entry[];
  education: Entry[];
  body: Node;
}

export interface Entry {
  position: string;
  institution: string;
  startedAt: string;
  endsAt: string;
  description: Node[];
}

export enum Kind {
  Document = 'Document',
  Paragraph = 'Paragraph',
  Str = 'Str',
  Emphasis = 'Emphasis',
  Strong = 'Strong',
  Header = 'Header',
  List = 'List',
  ListItem = 'ListItem',
  Link = 'Link',
}

export interface Position {
  line: number;
  column: number;
}

export interface Location {
  start: Position;
  end: Position;
}

export interface Node {
  type: Kind;
  raw: string;
  range: [number, number];
  loc: Location;
  value?: string;
  children?: Node[];
  depth?: number;
  url?: string;
}
