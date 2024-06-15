import LightningModal from "lightning/modal";
import { api, track } from "lwc";

export default class ViewDocumentModal extends LightningModal {
  @api content;
  @track url;
  @api isOpen;
  @track nameOfDoc;

  renderedCallback() {
    this.applyModalStyling();
  }

  connectedCallback() {
    console.log("contennntttt", JSON.stringify(this.content));
    this.url = this.content?.viewUrl;
    this.nameOfDoc = this.content?.nameOfDoc;
  }

  applyModalStyling() {
    const modalBody = this.template.querySelector("lightning-modal-body");
    if (modalBody) {
      const STYLE = document.createElement("style");
      STYLE.innerText = `.slds-modal_large .slds-modal__container{
      width: 98%;
      max-width: none;
      min-width: 40rem;}`;
      modalBody.appendChild(STYLE);
    } else {
      // Handle the case where the lightning-modal-body element is not found
      console.warn("lightning-modal-body element not found");
    }
  }

  // closeModal() {
  //   this.isOpen = false;
  //   this.dispatchEvent(new CustomEvent("close"));
  // }

  handleOkay() {
    this.close("okay");
  }
}
