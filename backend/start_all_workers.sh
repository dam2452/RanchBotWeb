#!/bin/bash

cd "$(dirname "$0")"

if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

export PYTHONPATH="${PYTHONPATH}:$(pwd)"

echo "Starting RabbitMQ workers..."

python workers/thumbnail_worker.py &
THUMBNAIL_PID=$!
echo "Thumbnail worker started (PID: $THUMBNAIL_PID)"

python workers/adjustment_worker.py &
ADJUSTMENT_PID=$!
echo "Adjustment worker started (PID: $ADJUSTMENT_PID)"

echo ""
echo "All workers started!"
echo "To stop all workers, run: kill $THUMBNAIL_PID $ADJUSTMENT_PID"

wait
