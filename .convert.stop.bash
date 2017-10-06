if [ -f converting.lock ]; then
  read -r pid < converting.lock

#  echo "PID: $pid";
  if kill -0 $pid; then
    kill -STOP $pid
    exit
  fi
fi

