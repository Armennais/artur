const amqp = require("amqplib");
const winston = require("winston");

const QUEUE_NAME = "task_queue";
const RESULT_QUEUE_NAME = "result_queue";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logfile.log" }),
  ],
});

async function processTask(task) {
  return { "Proccess result": task };
}
async function main() {
  try {
    const connection = await amqp.connect("amqp://127.0.0.1");
    logger.info("M2 microservice listening at http://localhost:3000");
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.assertQueue(RESULT_QUEUE_NAME, { durable: true });

    logger.info("Waiting for tasks...");
    channel.consume(QUEUE_NAME, async (message) => {
      const task = JSON.parse(message.content.toString());
      logger.info("Received task:", task);

      const result = await processTask(task);

      channel.sendToQueue(
        RESULT_QUEUE_NAME,
        Buffer.from(JSON.stringify(result)),
        {
          persistent: true,
        }
      );

      channel.ack(message);
    });
  } catch (err) {
    logger.error("Error while processing task:", err);
  }
}

main();
