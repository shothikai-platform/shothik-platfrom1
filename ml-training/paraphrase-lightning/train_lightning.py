"""
Lightning AI Paraphrase Training Script
Upload this to your Lightning AI Studio
"""

import lightning as L
from lightning.pytorch.callbacks import ModelCheckpoint
import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer, AdamW
from datasets import load_dataset

class ParaphraseModel(L.LightningModule):
    def __init__(self, model_name="t5-base"):
        super().__init__()
        self.model = T5ForConditionalGeneration.from_pretrained(model_name)
        self.tokenizer = T5Tokenizer.from_pretrained(model_name)
        
    def training_step(self, batch, batch_idx):
        outputs = self.model(**batch)
        loss = outputs.loss
        self.log("train_loss", loss)
        return loss
    
    def configure_optimizers(self):
        return AdamW(self.model.parameters(), lr=3e-4)

def main():
    # Load data
    dataset = load_dataset("paws", "labeled_final")
    
    # Create model
    model = ParaphraseModel()
    
    # Trainer
    trainer = L.Trainer(
        max_epochs=3,
        accelerator="gpu",
        devices=1,
        callbacks=[ModelCheckpoint(monitor="train_loss")]
    )
    
    # Train
    trainer.fit(model)
    
    # Save
    model.model.save_pretrained("./paraphrase-t5")
    print("✅ Model saved!")

if __name__ == "__main__":
    main()
