import { DMChannel, Message, MessageOptions, MessagePayload, ThreadChannel } from "discord.js";
import { Logger } from "./Logger";

export const isValidURL = (input: string) => {
    let url;

    try {
        url = new URL(input);
    } catch (_) {
        return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";

}

export const sendToChannel = async (channel: ThreadChannel | DMChannel, options: string | MessagePayload | MessageOptions, retries = 0): Promise<Message | undefined> => {
    try {
        return channel.send(options);
    } catch (error) {
        if (error.code === 500) {
            if (retries === 5) return;
            Logger.info(`Code 500 error, retrying in 2 seconds the ${retries} time`);
            await new Promise((res, _) => setTimeout(res, 2000));
            return sendToChannel(channel, options, ++retries);
        }
    }
}