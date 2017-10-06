if [ -f converting.lock ]; then
  echo "Converting lock is presend. Abort"
  exit
fi

echo $$ >  converting.lock

files=`du -a incomming/* | sort -n | head -n 100 | cut -f 2`
mkdir incomming &> /dev/null
mkdir .processing &> /dev/null
mkdir outcomming &> /dev/null

while read line; do
    echo "CONVERTING $line"

    file=${line#incomming}
    resfile=`echo $file | sed -e 's/\.\w*$/\.opus\.x265\.mkv/'`

    busy=`lsof -t "incomming/$file"`
    rmdir "incomming$file" &> /dev/null
    if [ ! -z "$busy" ]; then
      continue;
    fi;

    processing=".processing$resfile"

    result="outcomming$resfile"

    mkdir -p -- "$(dirname -- "$result")"
    mkdir -p -- "$(dirname -- "$processing")"

    cp "$line" "$result" 
    rm "$processing" &> /dev/null
    res=`nice -n 9001 ffmpeg -d -loglevel panic -i "$line" -c:v libx265 -crf 27 -c:a libopus -b:a 50k -threads 1 "$processing" & echo $! > converting.lock`

    mv "$processing" "$result"
    echo "done: $line"
    rm "$line"
done <<< "$files"

rm converting.lock
