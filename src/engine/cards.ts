import type { Card } from "../types";

export const FACTIONS: { [key: number]: string } = {
    1: "Roger's Pirates",
    2: "Whitebeard's Pirates",
    3: "Yonko",
    4: "Shichibukai",
    5: "Worst Generation",
    6: "Marines",
    7: "Monkey family",
    8: "Adopted and Honorary",
    9: "Revolutionary Army",
    10: "Red Hair Pirates",
    11: "Cross Guild",
    12: "Straw Hat Pirates",
    13: "Kuja Pirates",
    14: "Baroque Works",
    15: "Fish-men",
    16: "Father-Son",
    17: "Skypiea",
    18: "Kid Pirates",
    19: "Baratie crew",
    20: "Black Cat Pirates",
    21: "Giants",
    22: "Arlong's Pirates",
    23: "Baratie Arc",
    24: "Blackbeard's Pirates"
  };
  
  export const CARDS_DATA: Card[] = [
    {
      id: 0,
      name: "Luffy",
      power: 100,
      factions: [1],
      image: "luffy.png",
      rank: 95
    },
    {
      id: 1,
      name: "Zoro",
      power: 95,
      factions: [1],
      image: "zoro.png",
      rank: 90
    },
    {
      id: 2,
      name: "Nami",
      power: 70,
      factions: [1],
      image: "nami.png",
      rank: 75
    },
    {
      id: 3,
      name: "Usopp",
      power: 65,
      factions: [1],
      image: "usopp.png",
      rank: 70
    },
    {
      id: 4,
      name: "Sanji",
      power: 85,
      factions: [1],
      image: "sanji.png",
      rank: 80
    },
    {
      id: 5,
      name: "Chopper",
      power: 60,
      factions: [1],
      image: "chopper.png",
      rank: 65
    },
    {
      id: 6,
      name: "Robin",
      power: 75,
      factions: [1],
      image: "robin.png",
      rank: 78
    },
    {
      id: 7,
      name: "Franky",
      power: 80,
      factions: [1],
      image: "franky.png",
      rank: 82
    },
    {
      id: 8,
      name: "Brook",
      power: 75,
      factions: [1],
      image: "brook.png",
      rank: 77
    },
    {
      id: 9,
      name: "Jinbe",
      power: 90,
      factions: [1],
      image: "jinbe.png",
      rank: 88
    },
    {
      id: 10,
      name: "Vivi",
      power: 55,
      factions: [1],
      image: "vivi.png",
      rank: 58
    },
    {
      id: 11,
      name: "Ace",
      power: 95,
      factions: [2],
      image: "ace.png",
      rank: 92
    },
    {
      id: 12,
      name: "Sabo",
      power: 90,
      factions: [2],
      image: "sabo.png",
      rank: 87
    },
    {
      id: 13,
      name: "Shanks",
      power: 100,
      factions: [3],
      image: "shanks.png",
      rank: 100
    },
    {
      id: 14,
      name: "Mihawk",
      power: 98,
      factions: [3],
      image: "mihawk.png",
      rank: 98
    },
    {
      id: 15,
      name: "Whitebeard",
      power: 100,
      factions: [3],
      image: "whitebeard.png",
      rank: 100
    }
  ];