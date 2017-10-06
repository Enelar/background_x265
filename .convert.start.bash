if [ -f converting.lock ]; then
  read -r pid < converting.lock
  if kill -0 $pid; then
    kill -CONT $pid
    exit
  else
    rm converting.lock
  fi
fi

bash .convert_vps.bash &


