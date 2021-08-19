import { imapSettings } from "../../config/config";
//@ts-ignore
import notifier from "mail-notifier";
import { Logger } from "../../utils/Logger";

export default abstract class Notifier {         
    public static notiferInstance: any = notifier(imapSettings);
    public static notiferR: any;
    public static status: "running" | "stopped" = "stopped";
    public static started: boolean = false;

    public static start(startCB: Function) {
        if (this.status === "running")
            this.notiferR.stop(); 

        if (!this.started)  {
            this.notiferR = this.notiferInstance.on("mail", startCB);
            this.started = true;
        }
        this.notiferR.on("error", (err: any) => Logger.error("Error" + err));
        this.notiferR.on("end", () => Logger.info("Endet connection!"));

        this.notiferR.start();
        this.status = "running";
        Logger.info("Started listenting");
    }

    public static stop() {
        if (this.status === "stopped") return;
        this.notiferR.stop();
        this.status = "stopped";
        Logger.info("Stopped listening");
    }
}


//export default notifier(imapSettings);