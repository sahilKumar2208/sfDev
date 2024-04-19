import { LightningElement } from 'lwc';

export default class DummyLwc extends LightningElement {
    mapData

  connectedCallback(){
  const mapData = [
    { groupName: "Group 0", letters: ["abc", "xyz", "mno"] },
    { groupName: "Group 1", letters: ["ss", "aa", "bb"] }
  ];

  this.mapData = mapData
    console.log("mapData --->", JSON.stringify(mapData));
  }
}
