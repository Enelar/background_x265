while [ 1 ]; do
  last_activity=`xprintidle`
  if [[ last_activity -gt 3000 ]];
  then
    bash .convert.start.bash
  else
    bash .convert.stop.bash
  fi;
  
  sleep 1
done
