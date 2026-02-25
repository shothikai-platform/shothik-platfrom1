# Model conversion script: PyTorch -> ONNX
# Run this to convert HuggingFace models to ONNX format

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import onnx
from pathlib import Path
import argparse

def convert_to_onnx(
    model_name: str = "distilbert-base-uncased",
    output_path: str = "/models/ai-detector.onnx",
    max_length: int = 512
):
    """
    Convert HuggingFace model to ONNX format.
    
    For AI detection, you should fine-tune the model first on AI vs Human text.
    Example fine-tuning datasets:
    - HC3 (Human ChatGPT Comparison Corpus)
    - GhostBuster dataset
    - Custom Shothik dataset
    """
    
    print(f"🔄 Converting {model_name} to ONNX...")
    
    # Load model and tokenizer
    print("   Loading model...")
    model = AutoModelForSequenceClassification.from_pretrained(
        model_name,
        num_labels=2  # Binary: AI vs Human
    )
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    
    model.eval()
    
    # Create dummy input
    dummy_text = "This is a sample text for model conversion."
    inputs = tokenizer(
        dummy_text,
        return_tensors="pt",
        padding="max_length",
        truncation=True,
        max_length=max_length
    )
    
    # Export to ONNX
    print(f"   Exporting to {output_path}...")
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    torch.onnx.export(
        model,
        (inputs["input_ids"], inputs["attention_mask"]),
        output_path,
        input_names=["input_ids", "attention_mask"],
        output_names=["logits"],
        dynamic_axes={
            "input_ids": {0: "batch_size", 1: "sequence"},
            "attention_mask": {0: "batch_size", 1: "sequence"},
            "logits": {0: "batch_size"}
        },
        opset_version=14,
        do_constant_folding=True
    )
    
    # Verify ONNX model
    print("   Verifying ONNX model...")
    onnx_model = onnx.load(output_path)
    onnx.checker.check_model(onnx_model)
    
    print(f"✅ Conversion complete: {output_path}")
    print(f"   Model size: {Path(output_path).stat().st_size / 1024 / 1024:.1f} MB")
    
    return output_path

def quantize_model(
    model_path: str,
    output_path: str = None
):
    """
    Quantize ONNX model to INT8 for faster inference.
    Reduces model size by ~4x and speeds up CPU inference.
    """
    from onnxruntime.quantization import quantize_dynamic, QuantType
    
    if output_path is None:
        output_path = model_path.replace(".onnx", "-quantized.onnx")
    
    print(f"🔄 Quantizing {model_path}...")
    
    quantize_dynamic(
        model_input=model_path,
        model_output=output_path,
        weight_type=QuantType.QInt8,
        optimize_model=True
    )
    
    print(f"✅ Quantization complete: {output_path}")
    print(f"   Original size: {Path(model_path).stat().st_size / 1024 / 1024:.1f} MB")
    print(f"   Quantized size: {Path(output_path).stat().st_size / 1024 / 1024:.1f} MB")
    
    return output_path

def optimize_model(
    model_path: str,
    output_path: str = None
):
    """
    Optimize ONNX model for inference.
    """
    import onnxruntime.tools.optimizer as ort_optimizer
    
    if output_path is None:
        output_path = model_path.replace(".onnx", "-optimized.onnx")
    
    print(f"🔄 Optimizing {model_path}...")
    
    # Load and optimize
    model = onnx.load(model_path)
    
    # Basic optimizations
    from onnxruntime.transformers import optimizer
    optimized_model = optimizer.optimize_model(
        model_path,
        model_type="bert",
        num_heads=12,
        hidden_size=768,
        optimization_options=None
    )
    
    optimized_model.save_model_to_file(output_path)
    
    print(f"✅ Optimization complete: {output_path}")
    
    return output_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert models to ONNX")
    parser.add_argument("--model", default="distilbert-base-uncased", help="HuggingFace model name")
    parser.add_argument("--output", default="/models/ai-detector.onnx", help="Output path")
    parser.add_argument("--quantize", action="store_true", help="Quantize to INT8")
    parser.add_argument("--optimize", action="store_true", help="Optimize model")
    
    args = parser.parse_args()
    
    # Convert
    model_path = convert_to_onnx(args.model, args.output)
    
    # Optimize
    if args.optimize:
        model_path = optimize_model(model_path)
    
    # Quantize
    if args.quantize:
        model_path = quantize_model(model_path)
    
    print(f"\n✅ Final model: {model_path}")
