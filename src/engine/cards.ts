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
      id: 1,
      name: "Gol D Roger",
      power: 100,
      factions: [1, 16],
      image: "roger.png"
    },
    {
      id: 2,
      name: "Prime Whitebeard",
      power: 100,
      factions: [2, 3],
      image: "primewb.png"
    },
    {
      id: 3,
      name: "Prime Monkey D Garp",
      power: 100,
      factions: [6, 7, 8],
      image: "primegarp.png"
    },
    {
      id: 4,
      name: "Marshall D Teach",
      power: 96,
      factions: [2, 3, 4, 5, 24],
      image: "bb.png"
    },
    {
      id: 5,
      name: "Monkey D Dragon",
      power: 97,
      factions: [9, 7],
      image: "dragon.png"
    },
    {
      id: 6,
      name: "Prime Rayleigh",
      power: 95,
      factions: [1],
      image: "primerayleigh.png"
    },
    {
      id: 7,
      name: "Shanks",
      power: 95,
      factions: [1, 3, 10],
      image: "shanks.png"
    },
    {
      id: 8,
      name: "Akainu",
      power: 94,
      factions: [6],
      image: "akainu.png"
    },
    {
      id: 9,
      name: "Drakul Mihawk",
      power: 93,
      factions: [4, 11],
      image: "mihawk.png"
    },
    {
      id: 10,
      name: "Monkey D Luffy",
      power: 92,
      factions: [3, 5, 7, 8, 12],
      image: "luffy.png"
    },
    {
      id: 11,
      name: "Aokiji",
      power: 92,
      factions: [6, 24],
      image: "aokiji.png"
    },
    {
      id: 13,
      name: "Old Monkey D Garp",
      power: 91,
      factions: [6, 7, 8],
      image: "oldgarp.png"
    },
    {
      id: 13,
      name: "Old Whitebeard",
      power: 91,
      factions: [2, 3],
      image: "oldwb.png"
    },
    {
      id: 14,
      name: "Kizaru",
      power: 90,
      factions: [6],
      image: "kizaru.png"
    },
    {
      id: 15,
      name: "Old Rayleigh",
      power: 90,
      factions: [1],
      image: "oldrayleigh.png"
    },
    {
      id: 16,
      name: "Benn Beckman",
      power: 89,
      factions: [10],
      image: "bbeckman.png"
    },
    {
      id: 17,
      name: "Marco the Phoenix",
      power: 88,
      factions: [2],
      image: "marco.png"
    },
    {
      id: 18,
      name: "Eustass \"Captain\" Kid",
      power: 87,
      factions: [18, 5],
      image: "kid.png"
    },
    {
      id: 19,
      name: "Trafalgar D Water Law",
      power: 87,
      factions: [4, 5],
      image: "law.png"
    },
    {
      id: 20,
      name: "Roronoa Zoro",
      power: 86,
      factions: [12, 5],
      image: "zoro.png"
    },
    {
      id: 21,
      name: "Lucky Roux",
      power: 85,
      factions: [10],
      image: "luckyroux.png"
    },
    {
      id: 22,
      name: "Sir Crocodile",
      power: 84,
      factions: [4, 14, 11],
      image: "crocodile.png"
    },
    {
      id: 23,
      name: "Boa Hancock",
      power: 83,
      factions: [4, 13],
      image: "hancock.png"
    },
    {
      id: 24,
      name: "Winsmoke Sanji",
      power: 82,
      factions: [12, 19],
      image: "sanji.png"
    },
    {
      id: 25,
      name: "Killer",
      power: 81,
      factions: [18, 5],
      image: "killer.png"
    },
    {
      id: 26,
      name: "Yasopp",
      power: 81,
      factions: [10],
      image: "yasopp.png"
    },
    {
      id: 27,
      name: "Jinbei",
      power: 80,
      factions: [12, 4, 15],
      image: "jinbei.png"
    },
    {
      id: 28,
      name: "Donquixote Doflamingo",
      power: 79,
      factions: [4],
      image: "doffy.png"
    },
    {
      id: 29,
      name: "Portgas D Ace",
      power: 75,
      factions: [2, 16, 8],
      image: "ace.png"
    },
    {
      id: 30,
      name: "God Enel",
      power: 75,
      factions: [17],
      image: "enel.png"
    },
    {
      id: 31,
      name: "Bartholomew Kuma",
      power: 75,
      factions: [4, 9],
      image: "kuma.png"
    },
    {
      id: 32,
      name: "Urouge",
      power: 74,
      factions: [5],
      image: "urouge.png"
    },
    {
      id: 33,
      name: "X Drake",
      power: 73,
      factions: [5, 6],
      image: "drake.png"
    },
    {
      id: 34,
      name: "Smoker",
      power: 72,
      factions: [6],
      image: "smoker.png"
    },
    {
      id: 35,
      name: "Nico Robin",
      power: 71,
      factions: [12, 14],
      image: "robin.png"
    },
    {
      id: 36,
      name: "Basil Hawkins",
      power: 71,
      factions: [5],
      image: "hawkins.png"
    },
    {
      id: 37,
      name: "Cyborg Franky",
      power: 70,
      factions: [12],
      image: "franky.png"
    },
    {
      id: 38,
      name: "Soul King Brook",
      power: 70,
      factions: [12],
      image: "brook.png"
    },
    {
      id: 39,
      name: "Gecko Moria",
      power: 69,
      factions: [4],
      image: "moria.png"
    },
    {
      id: 40,
      name: "Capone \"Gang\" Bege",
      power: 68,
      factions: [5],
      image: "capone.png"
    },
    {
      id: 41,
      name: "Jewelry Bonney",
      power: 67,
      factions: [5],
      image: "bonney.png"
    },
    {
      id: 42,
      name: "Mr1 Daz Bonez",
      power: 66,
      factions: [14, 11],
      image: "mr1.png"
    },
    {
      id: 43,
      name: "Rockstar",
      power: 65,
      factions: [10],
      image: "rockstar.png"
    },
    {
      id: 44,
      name: "Clown Buggy",
      power: 64,
      factions: [1, 4, 3, 11],
      image: "buggy.png"
    },
    {
      id: 45,
      name: "Tony Tony Chopper",
      power: 63,
      factions: [12],
      image: "chopper.png"
    },
    {
      id: 46,
      name: "Usopp",
      power: 62,
      factions: [12],
      image: "usopp.png"
    },
    {
      id: 47,
      name: "Nami",
      power: 61,
      factions: [12, 22],
      image: "nami.png"
    },
    {
      id: 48,
      name: "Scratchmen Apoo",
      power: 61,
      factions: [5],
      image: "apoo.png"
    },
    {
      id: 49,
      name: "Mr2 Bentham",
      power: 60,
      factions: [14],
      image: "mr2.png"
    },
    {
      id: 50,
      name: "Marguerite",
      power: 59,
      factions: [13],
      image: "marguerite.png"
    },
    {
      id: 51,
      name: "Mr3 Galdino",
      power: 58,
      factions: [14, 11],
      image: "mr3.png"
    },
    {
      id: 52,
      name: "Broggy",
      power: 57,
      factions: [21],
      image: "broggy.png"
    },
    {
      id: 53,
      name: "Dorry",
      power: 57,
      factions: [21],
      image: "dorry.png"
    },
    {
      id: 54,
      name: "Jango",
      power: 56,
      factions: [20, 6],
      image: "jango.png"
    },
    {
      id: 55,
      name: "Miss Double Finger",
      power: 55,
      factions: [14],
      image: "msdoublefinger.png"
    },
    // {
    //   id: 56,
    //   name: "Arlong",
    //   power: 54,
    //   factions: [15, 22],
    //   image: "arlong.png"
    // },
    {
      id: 57,
      name: "Don Krieg",
      power: 53,
      factions: [23],
      image: "donkrieg.png"
    },
    {
      id: 58,
      name: "Kuro (Klahadore)",
      power: 52,
      factions: [20],
      image: "kuro.png"
    },
    {
      id: 59,
      name: "Zeff",
      power: 51,
      factions: [23, 19],
      image: "zeff.png"
    },
    {
      id: 60,
      name: "Miss Golden Week",
      power: 50,
      factions: [14],
      image: "msgoldenweek.png"
    }
    // ... продолжить для остальных карт
  ];