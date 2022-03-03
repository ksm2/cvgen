CV Generator
============

A Node.js script which generates beautiful CV PDFs from a Markdown template.

The main goal is to make creating CVs fun and easy by using a text-based format which
is easy to read and write for humans.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Markdown Format](#markdown-format)

## Install

Use [Yarn](https://yarnpkg.com/) to install dependencies:

    yarn install

## Usage

This project provides a script which allows rendering a Markdown file as a CV.
You can run it as follows:

    yarn run build input.md output.pdf

## Markdown Format

The Markdown parser uses [Frontmatter](https://www.npmjs.com/package/frontmatter) to collect metadata for the CV.
Main points like experience and education are written as simple headings.

Here is an example:
```markdown
---
lang: "en"
firstName: "John"
lastName: "Doe"
middleName: "Michael"
title: "Full-Stack Developer"
email: jdoe@example.org
phone: +1-555-123456
address: |
  42 Amsterdam Ave
  New York, NY 10023
  USA
dateOfBirth: 1990-01-01
placeOfBirth: New York
citizenship: USA
github: jdoe
linkedin: jdoe
twitter: jdoe
picture: jdoe.jpg
languageSkills:
  english: 10  
  german: 8
---

Experience
==========

2019/01 - today
---------------
**Job Title**

ACME Ltd., New York, NY, US
- Built software for spaceship
- Successful launch on Mars

2016/06 - 2018/12
-----------------
**Another Job**

Snake Oil Industries, New York, NY, US
- Picked apples from a tree
- Backed delicious pies
```
