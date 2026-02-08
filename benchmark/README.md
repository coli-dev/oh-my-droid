# SWE-bench Benchmark Suite

Automated benchmark comparison between vanilla Droid and OMD-enhanced Droid.

## Quick Start

```bash
# 1. One-time setup
./setup.sh

# 2. Quick sanity test (5 instances)
./quick_test.sh

# 3. Full comparison
./run_full_comparison.sh
```

## Scripts

### setup.sh
One-time setup and verification:
- Installs Python dependencies
- Builds Docker image for SWE-bench
- Downloads and caches dataset
- Verifies API key
- Builds OMD project
- Runs sanity checks

**Usage:**
```bash
./setup.sh
```

### quick_test.sh
Quick sanity test with limited instances (default: 5):
- Tests both vanilla and OMD modes
- Fast verification before full runs
- Recommended before production benchmarks

**Usage:**
```bash
./quick_test.sh [--limit N] [--model MODEL] [--timeout SECS]
```

**Examples:**
```bash
./quick_test.sh                    # Test 5 instances
./quick_test.sh --limit 10         # Test 10 instances
./quick_test.sh --timeout 300      # 5 minutes per instance
```

### run_vanilla.sh
Run vanilla Droid benchmark:
- Standard Droid without OMD
- Saves predictions to `predictions/vanilla/`
- Logs to `logs/vanilla_*.log`

**Usage:**
```bash
./run_vanilla.sh [OPTIONS]
```

**Options:**
- `--limit N` - Limit to N instances (default: all)
- `--skip N` - Skip first N instances (default: 0)
- `--model MODEL` - Droid model to use (default: claude-sonnet-4.5-20250929)
- `--timeout SECS` - Timeout per instance (default: 300)

**Examples:**
```bash
./run_vanilla.sh                           # Full benchmark
./run_vanilla.sh --limit 100               # First 100 instances
./run_vanilla.sh --skip 100 --limit 100    # Instances 101-200
./run_vanilla.sh --timeout 600             # 10 minutes per instance
```

### run_omd.sh
Run OMD-enhanced benchmark:
- Droid with oh-my-droid orchestration
- Saves predictions to `predictions/omd/`
- Logs to `logs/omd_*.log`

**Usage:**
```bash
./run_omd.sh [OPTIONS]
```

**Options:** Same as `run_vanilla.sh`

**Examples:**
```bash
./run_omd.sh                    # Full benchmark
./run_omd.sh --limit 100        # First 100 instances
```

### run_full_comparison.sh
Complete benchmark suite:
- Runs vanilla benchmark
- Runs OMD benchmark
- Evaluates both runs
- Generates comparison report

**Usage:**
```bash
./run_full_comparison.sh [OPTIONS]
```

**Options:**
- `--limit N` - Limit to N instances
- `--skip N` - Skip first N instances
- `--model MODEL` - Droid model to use
- `--timeout SECS` - Timeout per instance
- `--skip-vanilla` - Skip vanilla benchmark run
- `--skip-omd` - Skip OMD benchmark run
- `--skip-eval` - Skip evaluation step

**Examples:**
```bash
./run_full_comparison.sh                    # Full comparison
./run_full_comparison.sh --limit 100        # Test 100 instances
./run_full_comparison.sh --skip-vanilla     # Only run OMD (reuse vanilla results)
```

## Directory Structure

```
benchmark/
├── setup.sh                    # One-time setup
├── quick_test.sh              # Quick sanity test
├── run_vanilla.sh             # Run vanilla benchmark
├── run_omd.sh                 # Run OMD benchmark
├── run_full_comparison.sh     # Full comparison suite
├── run_benchmark.py           # Main Python benchmark runner
├── Dockerfile                 # Docker image for SWE-bench
├── docker-compose.yml         # Docker compose config
├── requirements.txt           # Python dependencies
├── predictions/
│   ├── vanilla/              # Vanilla predictions
│   └── omd/                  # OMD predictions
├── logs/
│   ├── vanilla_*.log         # Vanilla run logs
│   └── omd_*.log            # OMD run logs
├── results/
│   ├── vanilla_results.json  # Vanilla evaluation
│   ├── omd_results.json      # OMD evaluation
│   └── comparison_report.md  # Comparison report
├── data/                      # Test data
└── cache/                     # Dataset cache
```

## Prerequisites

- Docker
- Python 3.8+
- Node.js and npm
- ANTHROPIC_API_KEY environment variable

```bash
export ANTHROPIC_API_KEY=your_key_here
```

## Workflow

1. **Setup** (one-time):
   ```bash
   ./setup.sh
   ```

2. **Quick Test** (recommended):
   ```bash
   ./quick_test.sh
   ```

3. **Full Benchmark**:
   ```bash
   # Option A: Run full comparison
   ./run_full_comparison.sh

   # Option B: Run individually
   ./run_vanilla.sh
   ./run_omd.sh
   ```

4. **Review Results**:
   - Check `results/comparison_report.md`
   - Inspect predictions in `predictions/vanilla/` and `predictions/omd/`
   - Review logs in `logs/`

## Troubleshooting

### Setup Issues
```bash
./setup.sh
# Check output for specific errors
```

### API Key Issues
```bash
# Verify API key is set
echo $ANTHROPIC_API_KEY

# Export if missing
export ANTHROPIC_API_KEY=your_key_here
```

### Docker Issues
```bash
# Check Docker is running
docker ps

# Rebuild image
docker build -t swe-bench-runner .
```

### Python Dependencies
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

## Advanced Usage

### Custom Model
```bash
./run_vanilla.sh --model claude-opus-4-6-20260205
./run_omd.sh --model claude-opus-4-6-20260205
```

### Longer Timeout
```bash
# 15 minutes per instance
./run_full_comparison.sh --timeout 900
```

### Subset Testing
```bash
# Test instances 50-150
./run_full_comparison.sh --skip 50 --limit 100
```

### Resume Failed Run
```bash
# If vanilla failed at instance 42, skip to 42 and continue
./run_vanilla.sh --skip 42
```

## Performance Tips

1. **Start Small**: Use `quick_test.sh` to verify setup
2. **Parallel Runs**: Don't run vanilla and OMD in parallel (share API rate limits)
3. **Monitor Logs**: Use `tail -f logs/vanilla_*.log` to watch progress
4. **Timeout Tuning**: Increase timeout for complex instances
5. **Disk Space**: Ensure sufficient space for predictions and Docker containers

## Interpreting Results

### Metrics
- **Solve Rate**: Percentage of instances successfully resolved
- **Token Usage**: Average tokens per instance
- **Time**: Average time per instance
- **Error Rate**: Percentage of instances that errored

### Comparison Report
The `results/comparison_report.md` includes:
- Side-by-side metrics
- Statistical significance tests
- Instance-level comparisons
- Qualitative analysis

## License

Same as parent project (MIT)
