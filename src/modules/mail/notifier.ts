import { imapSettings } from "../../config/config";
//@ts-ignore
import notifier from "mail-notifier";
import { Logger } from "../../utils/Logger";

export default abstract class Notifier {         
    public static notifierInstance: any = notifier(imapSettings);
    public static status: "running" | "stopped" = "stopped";
    public static started: boolean = false;

    public static start(startCB: Function) {
        if (this.status === "running")
            this.notifierInstance.stop(); 

        if (!this.started)  {
            this.notifierInstance = this.notifierInstance.on("mail", startCB);
            this.started = true;
        }
        this.notifierInstance.on("error", (err: any) => {
            // restart
            this.notifierInstance.stop();
            this.notifierInstance.start();
        });

        this.notifierInstance.start();
        this.status = "running";
        Logger.info("Started listenting");
    }

    public static stop() {
        if (this.status === "stopped") return;
        this.notifierInstance.stop();
        this.status = "stopped";
        Logger.info("Stopped listening");
    }
}