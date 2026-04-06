# Multi-stage Dockerfile for Go-based Frontend
# Build Stage
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Final Stage
FROM gcr.io/distroless/static-debian12
WORKDIR /app
COPY --from=builder /app/main .
COPY templates ./templates
COPY static ./static
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["./main"]
