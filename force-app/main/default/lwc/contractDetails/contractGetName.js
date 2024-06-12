import { LightningElement, api } from "lwc";

export default class ApproversList extends LightningElement {
  @api approvers;

  get processedApprovers() {
    return this.approvers.map((level) => ({
      ...level,
      fullNames: level.fullNames.map((name) => ({
        name,
        initials: this.getInitials(name)
      }))
    }));
  }

  getInitials(name) {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("");
  }
}
