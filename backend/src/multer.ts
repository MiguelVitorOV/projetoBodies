import multer from "multer";


export const multerConfig = {
  storage: multer.memoryStorage(), // Armazena o buffer na memória
};