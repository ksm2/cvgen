export interface CV {
  filename: string
  lang: string
  firstName: string
  middleName: string
  lastName: string
  email: string
  phone: string
  address: string
  dateOfBirth: Date
  placeOfBirth: string
  citizenship: string
  picture: string
  body: Node
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
  line: number
  column: number
}

export interface Location {
  start: Position
  end: Position
}

export interface Node {
  type: Kind
  raw: string
  range: [number, number]
  loc: Location
  value?: string
  children?: Node[]
  depth?: number
  url?: string
}
