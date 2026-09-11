const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  LevelFormat,
  BorderStyle,
} = require("docx");

const dishes = [
  {
    name: "Chicken Masala Fry",
    description:
      "A quick semi-dry chicken masala — sears the chicken in your spices for a fast, punchy weeknight (or midnight) meal.",
    uses: ["chicken", "masalas"],
    missing: ["onion", "tomato", "ginger-garlic paste", "cooking oil", "salt"],
    minutes: 30,
    steps: [
      "Heat oil in a pan and add chopped onion. Sauté until golden brown.",
      "Add ginger-garlic paste and cook for 1 minute until fragrant.",
      "Add chopped tomato and cook until it softens and breaks down.",
      "Add the chicken pieces and sear on medium-high heat for about 5 minutes.",
      "Stir in your masalas (turmeric, chili powder, garam masala) and salt.",
      "Cover and cook for 12–15 minutes, stirring occasionally, until the chicken is fully cooked.",
      "Uncover and cook a couple more minutes to reduce any extra liquid for a semi-dry finish.",
      "Serve hot with rice or roti.",
    ],
  },
  {
    name: "Egg Bhurji",
    description:
      "Indian-style scrambled eggs — the fastest thing on this list, ready in about 10 minutes. Great for a late-night craving.",
    uses: ["egg", "masalas"],
    missing: ["onion", "cooking oil", "salt"],
    minutes: 10,
    steps: [
      "Heat oil in a pan over medium heat.",
      "Add chopped onion and sauté until soft and translucent.",
      "Stir in your masalas (turmeric, chili powder) and cook for 30 seconds.",
      "Crack the eggs directly into the pan.",
      "Scramble continuously, breaking the eggs up as they cook.",
      "Add salt and cook until just set — don't overcook, or it turns rubbery.",
      "Serve hot with bread or rice.",
    ],
  },
  {
    name: "Chicken Egg Curry",
    description:
      "A hearty combo curry that uses both the chicken and the eggs in one spiced gravy — makes the most of everything you've got.",
    uses: ["chicken", "egg", "masalas"],
    missing: ["onion", "tomato", "ginger-garlic paste", "cooking oil", "salt", "water"],
    minutes: 40,
    steps: [
      "Boil the eggs for 8–10 minutes, then peel and set aside.",
      "Heat oil in a pot and sauté chopped onion until golden.",
      "Add ginger-garlic paste and chopped tomato; cook until soft and the oil starts to separate.",
      "Stir in your masalas (turmeric, chili powder, garam masala) and salt; cook for 1 minute.",
      "Add the chicken pieces and sear for 5–7 minutes.",
      "Add water to form a gravy, cover, and simmer for 15 minutes until the chicken is cooked through.",
      "Add the boiled eggs and simmer for 5 more minutes so they soak up the gravy.",
      "Serve hot with rice or roti.",
    ],
  },
];

const heading = (text) =>
  new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });

const label = (text) =>
  new TextRun({ text, bold: true });

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "steps-numbering",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.START,
          },
        ],
      },
      {
        reference: "tags-bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.START,
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: { size: { width: 12240, height: 15840 } },
      },
      children: [
        new Paragraph({
          text: "House Maker",
          heading: HeadingLevel.TITLE,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Top 3 Indian, non-veg dishes from: chicken, egg, and masalas",
              italics: true,
              color: "555555",
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: '"Masalas" was taken as common Indian spices — turmeric, chili powder, and garam masala. Swap in whatever you actually have.',
              size: 20,
              color: "888888",
            }),
          ],
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: "DDDDDD", space: 8 },
          },
          spacing: { after: 300 },
        }),

        ...dishes.flatMap((dish, i) => [
          heading(`${i + 1}. ${dish.name}  (~${dish.minutes} min)`),
          new Paragraph({
            children: [new TextRun({ text: dish.description, italics: true })],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [label("Uses: "), new TextRun(dish.uses.join(", "))],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [label("Missing: "), new TextRun(dish.missing.join(", "))],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [label("Steps")],
            spacing: { after: 80 },
          }),
          ...dish.steps.map(
            (step) =>
              new Paragraph({
                text: step,
                numbering: { reference: "steps-numbering", level: 0 },
                spacing: { after: 60 },
              })
          ),
        ]),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  require("fs").writeFileSync("House-Maker-Top-3-Dishes.docx", buffer);
  console.log("done");
});
