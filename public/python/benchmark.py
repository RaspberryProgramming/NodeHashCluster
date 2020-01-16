import time
import math
import hashlib
import cProfile

def floor(num):
    i= int(num)
    if (i > num):
        i -= 1
    
    return i

def getLevelSize(level, arraySize):
  size = 0
  i = 1
  while (i <= level): 
    size = arraySize ** i + size
    i += 1

  return size


def getLevel(id, arraySize):
  id += 1
  level = 0
  beggining = 0
  while (beggining < id):
    beggining = 0
    level += 1
    i = 1
    while (i<= level): 
        beggining = arraySize ** i + beggining
        i+=1


  if beggining == 0:
        return level
  else:
       return level - 1


def numToTextCode(chars, num):
  charslen = len(chars)

  level = getLevel(num, charslen)

  
  line = ""  # clear the line
 
  num -= getLevelSize(level - 1, charslen)
  
  # The new code is generated
  while True:
   # The code is determined by the remainder of the new text code and the size of chars array
    charLoc = num % charslen

    line += chars[charLoc]  # The first character is copied to the line

    # The division of the textcode and chars array size is stored. This moves us to the next char in the charcode
    num = floor(num / charslen)
  # Once tempTextCode is 0 or less, there aren't any more characters in the char code
    if(num <= 0):
        break
    
  startchar = chars[0]
  while (len(line) < level):
    # If the
    line += startchar
  return line


def benchmark(chars, start, stop):
  time1 = time.time()
  text = ""
  for i in range(start, stop):
    text = numToTextCode(chars, i)
    hashlib.sha256(text.encode('utf-8')).hexdigest()
  time2 = time.time()
  return time2 - time1


chars = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
]
count = 265000
#cProfile.run('benchmark(chars, 0, count)', sort='cumtime')
t = benchmark(chars, 0, count)
print(t)
print(math.floor(count / t))
